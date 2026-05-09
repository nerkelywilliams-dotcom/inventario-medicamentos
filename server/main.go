package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"

	"github.com/gin-gonic/gin"
)

// ==========================================
// 1. ESTRUCTURAS (Reemplazo de Zod y Tipos)
// ==========================================

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type ChatRequest struct {
	Prompt string `json:"prompt" binding:"required,min=1"`
}

// ==========================================
// 2. INTERFAZ STORAGE (Reemplazada por IStorage de repository.go)
// ==========================================

// Instancia global (Inicializada con DB real en main)
var storage IStorage

// ==========================================
// 3. MIDDLEWARES
// ==========================================

// AuthMiddleware extrae el usuario del header x-user (Igual a Express)
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userHeader := c.GetHeader("x-user")
		if userHeader != "" {
			decoded, err := base64.StdEncoding.DecodeString(userHeader)
			if err == nil {
				var user User
				if err := json.Unmarshal(decoded, &user); err == nil {
					c.Set("user", user)
				} else {
					log.Println("Error al parsear el JSON del header x-user")
				}
			} else {
				log.Println("Error al decodificar base64 del header x-user")
			}
		}
		c.Next()
	}
}

// Helper para obtener usuario del contexto
func getUserFromContext(c *gin.Context) *User {
	user, exists := c.Get("user")
	if !exists {
		return nil
	}
	u := user.(User)
	return &u
}

// ==========================================
// 4. FUNCIONES DE LÓGICA / IA
// ==========================================

func normalizeText(s string) string {
	s = strings.ToLower(s)
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	s, _, _ = transform.String(t, s)

	reg := regexp.MustCompile(`[^a-z0-9\s]`)
	s = reg.ReplaceAllString(s, "")
	return strings.TrimSpace(s)
}

func searchTextForMedication(med Medication) string {
	parts := []string{}
	if med.Catalog.Name != "" {
		parts = append(parts, med.Catalog.Name)
	}
	if med.Catalog.Description != nil {
		parts = append(parts, *med.Catalog.Description)
	}
	if med.Catalog.Indications != nil {
		parts = append(parts, *med.Catalog.Indications)
	}
	if med.Catalog.MechanismOfAction != nil {
		parts = append(parts, *med.Catalog.MechanismOfAction)
	}
	if med.Catalog.AdministrationRoute != nil {
		parts = append(parts, *med.Catalog.AdministrationRoute)
	}
	if med.Family != nil {
		parts = append(parts, med.Family.Name)
	}
	parts = append(parts, med.Presentation, strconv.Itoa(med.Quantity))

	var validParts []string
	for _, p := range parts {
		if p != "" {
			validParts = append(validParts, p)
		}
	}
	return normalizeText(strings.Join(validParts, " "))
}

func findMedicationMatchesByIndication(prompt string, meds []Medication) []Medication {
	normalizedPrompt := normalizeText(prompt)
	var matches []Medication

	for _, med := range meds {
		var indicationsParts []string
		if med.Catalog.Name != "" {
			indicationsParts = append(indicationsParts, med.Catalog.Name)
		}
		if med.Catalog.Description != nil {
			indicationsParts = append(indicationsParts, *med.Catalog.Description)
		}
		if med.Catalog.Indications != nil {
			indicationsParts = append(indicationsParts, *med.Catalog.Indications)
		}
		if med.Catalog.MechanismOfAction != nil {
			indicationsParts = append(indicationsParts, *med.Catalog.MechanismOfAction)
		}

		indicationsText := normalizeText(strings.Join(indicationsParts, " "))
		promptTokens := strings.Fields(normalizedPrompt)

		match := false
		for _, token := range promptTokens {
			if len(token) > 3 && strings.Contains(indicationsText, token) {
				match = true
				break
			}
		}

		if match || strings.Contains(indicationsText, normalizedPrompt) {
			matches = append(matches, med)
		}
	}
	return matches
}

func answerFromInventory(prompt string, meds []Medication, families []Family) string {
	normalizedPrompt := normalizeText(prompt)

	if len(meds) == 0 {
		return "No hay medicamentos registrados en esta sede actualmente."
	}

	phrases := map[string]bool{
		"diabetes":    regexp.MustCompile(`diabet|hiperglucemia|insulina`).MatchString(normalizedPrompt),
		"antibiotics": regexp.MustCompile(`antibiot|antibio`).MatchString(normalizedPrompt),
		"fever":       regexp.MustCompile(`fiebr|febr|antit[ií]rmico|paracetamol|ibuprofeno`).MatchString(normalizedPrompt),
		"cough":       regexp.MustCompile(`tos|toser|toses|resfriado|gripe`).MatchString(normalizedPrompt),
		"pediatric":   regexp.MustCompile(`niñ|nino|ninio|infantil|pediatrico`).MatchString(normalizedPrompt),
		"expiration":  regexp.MustCompile(`venc|caduc|expir|estado`).MatchString(normalizedPrompt),
		"lowStock":    regexp.MustCompile(`bajo stock|poco stock|escaso|faltan|agotar`).MatchString(normalizedPrompt),
		"total":       regexp.MustCompile(`cuant|cantidad|total|cuánto`).MatchString(normalizedPrompt),
	}

	var familyMatch *Family
	for _, f := range families {
		fNameParts := strings.Fields(normalizeText(f.Name))
		for _, word := range fNameParts {
			if strings.Contains(normalizedPrompt, word) {
				familyMatch = &f
				break
			}
		}
		if familyMatch != nil {
			break
		}
	}

	matchedMeds := meds
	if familyMatch != nil {
		var temp []Medication
		for _, m := range meds {
			if (m.FamilyID != nil && *m.FamilyID == familyMatch.ID) ||
				(m.Family != nil && strings.Contains(normalizeText(m.Family.Name), normalizeText(familyMatch.Name))) {
				temp = append(temp, m)
			}
		}
		matchedMeds = temp
	}

	getUniqueNames := func(mList []Medication, limit int) string {
		nameMap := make(map[string]bool)
		var names []string
		for _, m := range mList {
			name := m.Catalog.Name
			if name == "" {
				name = m.Presentation
			}
			if !nameMap[name] {
				nameMap[name] = true
				names = append(names, name)
				if len(names) >= limit {
					break
				}
			}
		}
		return strings.Join(names, ", ")
	}

	if phrases["diabetes"] {
		var matches []Medication
		for _, m := range meds {
			if strings.Contains(searchTextForMedication(m), "diabet") {
				matches = append(matches, m)
			}
		}
		if len(matches) == 0 {
			return "No se encontraron medicamentos con indicación directa para diabetes en este inventario."
		}
		return fmt.Sprintf("Tenemos %d registros asociados a diabetes. Algunos medicamentos son: %s.", len(matches), getUniqueNames(matches, 8))
	}

	if phrases["antibiotics"] {
		var matches []Medication
		for _, m := range meds {
			famName := ""
			if m.Family != nil {
				famName = m.Family.Name
			}
			if strings.Contains(normalizeText(famName), "antibiot") || strings.Contains(searchTextForMedication(m), "antibiot") {
				matches = append(matches, m)
			}
		}
		if len(matches) == 0 {
			return "No se encontraron antibióticos en el inventario de esta sede."
		}
		totalUnits := 0
		for _, m := range matches {
			totalUnits += m.Quantity
		}
		return fmt.Sprintf("Hay %d medicamentos registrados como antibióticos con un total de %d unidades disponibles.", len(matches), totalUnits)
	}

	if phrases["fever"] {
		var matches []Medication
		reg := regexp.MustCompile(`fiebr|febr|antit[ií]rmico|paracetamol|ibuprofeno|dipirona|metamizol`)
		for _, m := range meds {
			if reg.MatchString(searchTextForMedication(m)) {
				matches = append(matches, m)
			}
		}
		if len(matches) == 0 {
			return "No se encontraron medicamentos directamente relacionados con fiebre en este inventario."
		}

		var filtered []Medication
		if phrases["pediatric"] {
			for _, m := range matches {
				if m.IsPediatric {
					filtered = append(filtered, m)
				}
			}
		} else {
			filtered = matches
		}

		if len(filtered) == 0 {
			return "Hay medicamentos para fiebre, pero no se encontró ninguno marcado como pediátrico."
		}
		pedStr := ""
		if phrases["pediatric"] {
			pedStr = "en niños "
		}
		return fmt.Sprintf("Para fiebre %shay %d registros. Algunos son: %s.", pedStr, len(filtered), getUniqueNames(filtered, 8))
	}

	if phrases["cough"] {
		var matches []Medication
		for _, m := range meds {
			txt := searchTextForMedication(m)
			if strings.Contains(txt, "tos") || strings.Contains(txt, "antigripal") || strings.Contains(txt, "refri") {
				matches = append(matches, m)
			}
		}
		if len(matches) == 0 {
			return "No se encontraron medicamentos específicamente relacionados con la tos en este inventario."
		}
		var filtered []Medication
		if phrases["pediatric"] {
			for _, m := range matches {
				if m.IsPediatric {
					filtered = append(filtered, m)
				}
			}
		} else {
			filtered = matches
		}

		if len(filtered) == 0 {
			return "Hay medicamentos para la tos, pero no se encontró ninguno marcado como pediátrico."
		}
		pedStr := ""
		if phrases["pediatric"] {
			pedStr = "en niños "
		}
		return fmt.Sprintf("Para la tos %shay %d registros. Algunos son: %s.", pedStr, len(filtered), getUniqueNames(filtered, 8))
	}

	indicationMatches := findMedicationMatchesByIndication(prompt, meds)
	if len(indicationMatches) > 0 {
		return fmt.Sprintf("Encontré %d medicamentos con indicaciones relacionadas a tu consulta. Algunos son: %s.", len(indicationMatches), getUniqueNames(indicationMatches, 8))
	}

	if phrases["expiration"] || strings.Contains(normalizedPrompt, "vencidos") {
		now := time.Now()
		var expired []Medication
		for _, m := range meds {
			if m.ExpirationDate != nil {
				if t, err := time.Parse(time.RFC3339, *m.ExpirationDate); err == nil && t.Before(now) {
					expired = append(expired, m)
				}
			}
		}
		if len(expired) == 0 {
			return "No hay medicamentos vencidos en el inventario de esta sede."
		}
		return fmt.Sprintf("Hay %d medicamentos vencidos o próximos a vencer. Ejemplos: %s.", len(expired), getUniqueNames(expired, 8))
	}

	if phrases["lowStock"] {
		var low []Medication
		for _, m := range meds {
			if m.Quantity < 10 {
				low = append(low, m)
			}
		}
		if len(low) == 0 {
			return "No hay medicamentos con stock bajo por debajo de 10 unidades."
		}
		return fmt.Sprintf("Hay %d medicamentos con stock bajo. Algunos ejemplos son: %s.", len(low), getUniqueNames(low, 8))
	}

	if phrases["total"] {
		totalUnits := 0
		for _, m := range meds {
			totalUnits += m.Quantity
		}
		return fmt.Sprintf("En total hay %d medicamentos registrados y %d unidades en stock.", len(meds), totalUnits)
	}

	if familyMatch != nil {
		totalUnits := 0
		for _, m := range matchedMeds {
			totalUnits += m.Quantity
		}
		return fmt.Sprintf("La familia %s tiene %d medicamentos registrados con %d unidades totales. Ejemplos: %s.", familyMatch.Name, len(matchedMeds), totalUnits, getUniqueNames(matchedMeds, 8))
	}

	return fmt.Sprintf("Puedo responder consultas sobre familias, stock, vencimientos y usos. En esta sede hay %d medicamentos registrados. Algunos ejemplos son: %s.", len(meds), getUniqueNames(meds, 8))
}

func buildInventoryContext(meds []Medication, families []Family) string {
	totalUnits := 0
	var lowStock []string
	var expired []string
	now := time.Now()

	for _, m := range meds {
		totalUnits += m.Quantity
		name := m.Catalog.Name
		if name == "" {
			name = m.Presentation
		}

		if m.Quantity < 10 && len(lowStock) < 8 {
			lowStock = append(lowStock, name)
		}
		if m.ExpirationDate != nil {
			if t, err := time.Parse(time.RFC3339, *m.ExpirationDate); err == nil && t.Before(now) && len(expired) < 8 {
				expired = append(expired, name)
			}
		}
	}

	var familyDescriptions []string
	for _, f := range families {
		count := 0
		for _, m := range meds {
			if m.FamilyID != nil && *m.FamilyID == f.ID {
				count++
			}
		}
		familyDescriptions = append(familyDescriptions, fmt.Sprintf("%s: %d medicamentos", f.Name, count))
	}

	var sample []string
	for i, m := range meds {
		if i >= 12 {
			break
		}
		presentation := m.Presentation
		if presentation == "" {
			presentation = "sin presentación"
		}

		famName := "sin familia"
		if m.Family != nil {
			famName = m.Family.Name
		}

		expiration := "sin fecha de vencimiento"
		if m.ExpirationDate != nil {
			expiration = "vence " + *m.ExpirationDate
		}

		name := m.Catalog.Name
		if name == "" {
			name = m.Presentation
		}

		sample = append(sample, fmt.Sprintf("- %s (%s, familia: %s, cantidad: %d, %s)", name, presentation, famName, m.Quantity, expiration))
	}

	lowStockTxt := "No hay medicamentos con stock crítico. "
	if len(lowStock) > 0 {
		lowStockTxt = fmt.Sprintf("Bajo stock: %s. ", strings.Join(lowStock, ", "))
	}

	expiredTxt := "No hay medicamentos vencidos actualmente. "
	if len(expired) > 0 {
		expiredTxt = fmt.Sprintf("Vencidos o próximos a vencer: %s. ", strings.Join(expired, ", "))
	}

	return fmt.Sprintf("Inventario actual: %d registros, %d unidades totales. Familias: %s. %s%sMuestra de productos: %s.",
		len(meds), totalUnits, strings.Join(familyDescriptions, ", "), lowStockTxt, expiredTxt, strings.Join(sample, " "))
}

func callOpenAIInventoryAssistant(prompt string, meds []Medication, families []Family) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return answerFromInventory(prompt, meds, families) + "\n\n(Activa OPENAI_API_KEY en el servidor para obtener respuestas generadas por IA.)", nil
	}

	inventoryContext := buildInventoryContext(meds, families)

	reqBody := map[string]interface{}{
		"model": "gpt-3.5-turbo",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "Eres un asistente experto en inventarios de medicamentos. Responde en español con claridad, basándote en el contexto del inventario proporcionado. No inventes medicamentos que no estén en el inventario actual.",
			},
			{
				"role":    "user",
				"content": fmt.Sprintf("Tengo el siguiente contexto de inventario:\n%s\n\nPregunta: %s", inventoryContext, prompt),
			},
		},
		"max_tokens":  400,
		"temperature": 0.25,
	}

	jsonBytes, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("OpenAI API error: %d %s", resp.StatusCode, string(bodyBytes))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	choices := result["choices"].([]interface{})
	firstChoice := choices[0].(map[string]interface{})
	message := firstChoice["message"].(map[string]interface{})
	content := message["content"].(string)

	return strings.TrimSpace(content), nil
}

// ==========================================
// 5. REGISTRO DE RUTAS
// ==========================================

func RegisterRoutes(router *gin.Engine) {

	// Middleware global
	router.Use(AuthMiddleware())

	api := router.Group("/api")
	{
		// --- AUTH & USER ---
		api.GET("/user", func(c *gin.Context) {
			user := getUserFromContext(c)
			if user == nil {
				c.JSON(http.StatusUnauthorized, gin.H{"message": "No autenticado"})
				return
			}
			c.JSON(http.StatusOK, user)
		})

		api.POST("/auth/login", func(c *gin.Context) {
			var loginData LoginRequest
			if err := c.ShouldBindJSON(&loginData); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error en los datos de entrada"})
				return
			}

			// Bypass Maestro para Magdaleno
			if loginData.Username == "admin_magdaleno" && loginData.Password == "Magdaleno2026*" {
				c.JSON(http.StatusOK, gin.H{
					"id":                999,
					"username":          "admin_magdaleno",
					"isAdmin":           true,
					"role":              "admin",
					"inventoryLocation": "magdaleno",
				})
				return
			}

			user, err := storage.GetUserByUsername(loginData.Username)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Error interno del servidor"})
				return
			}

			// Soporta contraseña directa o bypass para admin_mag
			if user != nil && (user.Password == loginData.Password || loginData.Username == "admin_mag") {
				user.Password = "" // Omit password
				c.JSON(http.StatusOK, user)
				return
			}

			c.JSON(http.StatusUnauthorized, gin.H{"message": "Usuario o contraseña incorrectos"})
		})

		api.POST("/auth/logout", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Sesión cerrada correctamente"})
		})

		// --- RUTAS DE FAMILIAS ---
		api.GET("/families", func(c *gin.Context) {
			location := "magdaleno"
			if u := getUserFromContext(c); u != nil {
				location = u.InventoryLocation
			}

			families, err := storage.GetFamilies(location)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Error al obtener familias"})
				return
			}
			c.JSON(http.StatusOK, families)
		})

		api.POST("/families", func(c *gin.Context) {
			location := "magdaleno"
			if u := getUserFromContext(c); u != nil {
				location = u.InventoryLocation
			}

			var fam Family
			if err := c.ShouldBindJSON(&fam); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error en los datos"})
				return
			}
			fam.InventoryLocation = location
			newFam, err := storage.CreateFamily(fam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error al crear la familia"})
				return
			}
			c.JSON(http.StatusCreated, newFam)
		})

		api.PATCH("/families/:id", func(c *gin.Context) {
			id, _ := strconv.Atoi(c.Param("id"))
			var famData map[string]interface{}
			if err := c.ShouldBindJSON(&famData); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error en los datos"})
				return
			}
			updated, err := storage.UpdateFamily(id, famData)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error al actualizar familia"})
				return
			}
			c.JSON(http.StatusOK, updated)
		})

		api.DELETE("/families/:id", func(c *gin.Context) {
			id, _ := strconv.Atoi(c.Param("id"))
			if err := storage.DeleteFamily(id); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error al eliminar familia"})
				return
			}
			c.Status(http.StatusNoContent)
		})

		// --- RUTAS DE MEDICAMENTOS ---
		api.GET("/medications", func(c *gin.Context) {
			location := "magdaleno"
			if u := getUserFromContext(c); u != nil {
				location = u.InventoryLocation
			}

			search := c.Query("search")
			familyId := c.Query("familyId")

			meds, err := storage.GetMedications(search, familyId, location)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Error obteniendo medicamentos"})
				return
			}
			c.JSON(http.StatusOK, meds)
		})

		api.GET("/medications/:id", func(c *gin.Context) {
			id, err := strconv.Atoi(c.Param("id"))
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "ID inválido"})
				return
			}
			med, err := storage.GetMedication(id)
			if err != nil || med == nil {
				c.JSON(http.StatusNotFound, gin.H{"message": "No encontrado"})
				return
			}
			c.JSON(http.StatusOK, med)
		})

		api.POST("/medications", func(c *gin.Context) {
			location := "magdaleno"
			userId := 109
			if u := getUserFromContext(c); u != nil {
				location = u.InventoryLocation
				userId = u.ID
			}

			var med Medication
			if err := c.ShouldBindJSON(&med); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error en los datos de entrada"})
				return
			}
			med.InventoryLocation = location
			newMed, err := storage.CreateMedication(med)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error al guardar el medicamento", "error": err.Error()})
				return
			}

			storage.CreateLog(Log{
				Action:         "Creación",
				Details:        fmt.Sprintf("Nuevo ingreso: %d unidades", newMed.Quantity),
				UserID:         &userId,
				MedicationName: newMed.Catalog.Name,
				MedicationID:   &newMed.ID,
			})

			c.JSON(http.StatusCreated, newMed)
		})

		api.PUT("/medications/:id", func(c *gin.Context) {
			id, _ := strconv.Atoi(c.Param("id"))
			userId := 109
			if u := getUserFromContext(c); u != nil {
				userId = u.ID
			}

			var updateData map[string]interface{}
			if err := c.ShouldBindJSON(&updateData); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error en los datos"})
				return
			}

			updatedMed, err := storage.UpdateMedication(id, updateData)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error al actualizar el medicamento"})
				return
			}

			name, _ := updateData["name"].(string)
			storage.CreateLog(Log{
				Action:         "EDITAR",
				Details:        fmt.Sprintf("Se actualizó el medicamento completo: %s", name),
				UserID:         &userId,
				MedicationName: name,
				MedicationID:   &id,
			})

			c.JSON(http.StatusOK, updatedMed)
		})

		api.PATCH("/medications/:id", func(c *gin.Context) {
			id, _ := strconv.Atoi(c.Param("id"))
			userId := 109
			if u := getUserFromContext(c); u != nil {
				userId = u.ID
			}

			var updateData map[string]interface{}
			if err := c.ShouldBindJSON(&updateData); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error en los datos"})
				return
			}

			currentMed, _ := storage.GetMedication(id)
			medicationName := "Medicamento Desconocido"
			if name, ok := updateData["name"].(string); ok && name != "" {
				medicationName = name
			} else if currentMed != nil {
				medicationName = currentMed.Catalog.Name
			}

			updatedMed, err := storage.UpdateMedication(id, updateData)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error al actualizar el medicamento"})
				return
			}

			storage.CreateLog(Log{
				Action:         "EDITAR",
				Details:        fmt.Sprintf("Cambio parcial (Stock/Datos) en: %s", medicationName),
				UserID:         &userId,
				MedicationName: medicationName,
				MedicationID:   &id,
			})

			c.JSON(http.StatusOK, updatedMed)
		})

		api.DELETE("/medications/all", func(c *gin.Context) {
			u := getUserFromContext(c)
			isAdmin := u != nil && (u.Role == "admin" || u.Username == "admin_magdaleno")

			if !isAdmin {
				c.JSON(http.StatusForbidden, gin.H{"message": "No autorizado para vaciar inventario"})
				return
			}

			location := "magdaleno"
			if u != nil {
				location = u.InventoryLocation
			}

			if err := storage.DeleteAllMedications(location); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Error al vaciar", "error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Inventario vaciado por completo"})
		})

		api.DELETE("/medications/:id", func(c *gin.Context) {
			id, _ := strconv.Atoi(c.Param("id"))
			userId := 109
			if u := getUserFromContext(c); u != nil {
				userId = u.ID
			}

			medToDelete, _ := storage.GetMedication(id)
			if medToDelete != nil {
				storage.CreateLog(Log{
					Action:         "ELIMINAR",
					Details:        fmt.Sprintf("Se eliminó del inventario: %s", medToDelete.Catalog.Name),
					UserID:         &userId,
					MedicationName: medToDelete.Catalog.Name,
					MedicationID:   &id,
				})
			}

			if err := storage.DeleteMedication(id); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Error al eliminar el medicamento"})
				return
			}
			c.Status(http.StatusNoContent)
		})

		// --- BITÁCORA ---
		api.GET("/logs", func(c *gin.Context) {
			location := "magdaleno"
			if u := getUserFromContext(c); u != nil {
				location = u.InventoryLocation
			}

			logs, err := storage.GetRecentLogs(location, 50)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Error al obtener bitácora"})
				return
			}
			c.JSON(http.StatusOK, logs)
		})

		api.POST("/logs", func(c *gin.Context) {
			var body map[string]interface{}
			if err := c.ShouldBindJSON(&body); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Datos inválidos"})
				return
			}

			action, _ := body["action"].(string)
			details, _ := body["details"].(string)
			medicationName, _ := body["medicationName"].(string)
			name, _ := body["name"].(string)

			userID := 109
			if u := getUserFromContext(c); u != nil {
				userID = u.ID
			}
			var userIdPtr *int
			if v, ok := body["userId"]; ok {
				if vFloat, ok := v.(float64); ok {
					id := int(vFloat)
					userIdPtr = &id
				}
			} else {
				userIdPtr = &userID
			}

			var medID *int
			if v, ok := body["medicationId"]; ok && v != nil {
				if vFloat, ok := v.(float64); ok {
					id := int(vFloat)
					medID = &id
				}
			}

			finalMedName := medicationName
			if finalMedName == "" {
				finalMedName = name
			}

			if finalMedName == "" && details != "" && strings.Contains(details, ": ") {
				parts := strings.Split(details, ": ")
				finalMedName = parts[len(parts)-1]
			}

			if finalMedName == "" && medID != nil {
				if med, err := storage.GetMedication(*medID); err == nil && med != nil {
					finalMedName = med.Catalog.Name
				}
			}

			if action == "" {
				action = "Acción registrada"
			}
			if details == "" {
				details = "Cambio en inventario"
			}
			if finalMedName == "" {
				finalMedName = "Medicamento (Sin nombre)"
			}

			newLog, err := storage.CreateLog(Log{
				Action:         action,
				Details:        details,
				UserID:         userIdPtr,
				MedicationName: finalMedName,
				MedicationID:   medID,
			})

			if err != nil {
				log.Println("Fallo crítico en bitácora:", err)
				c.JSON(http.StatusCreated, gin.H{"message": "Log no guardado pero proceso continuado"})
				return
			}
			c.JSON(http.StatusCreated, newLog)
		})

		// --- DASHBOARD & ESTADÍSTICAS ---
		api.POST("/inventory/chat", func(c *gin.Context) {
			location := "magdaleno"
			if u := getUserFromContext(c); u != nil {
				location = u.InventoryLocation
			}

			var req ChatRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Ingresa una pregunta válida."})
				return
			}

			meds, errMeds := storage.GetMedications("", "", location)
			families, errFam := storage.GetFamilies(location)

			if errMeds != nil || errFam != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Error obteniendo datos del inventario"})
				return
			}

			answer, err := callOpenAIInventoryAssistant(req.Prompt, meds, families)
			if err != nil {
				log.Println("Error en chat de inventario:", err)
				fallbackAnswer := answerFromInventory(req.Prompt, meds, families)
				c.JSON(http.StatusOK, gin.H{"answer": fallbackAnswer})
				return
			}

			c.JSON(http.StatusOK, gin.H{"answer": answer})
		})

		api.GET("/inventory/stats", func(c *gin.Context) {
			location := "magdaleno"
			if u := getUserFromContext(c); u != nil {
				location = u.InventoryLocation
			}

			meds, err := storage.GetMedications("", "", location)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Error al obtener estadísticas"})
				return
			}

			lowStock := 0
			outOfStock := 0
			totalItems := 0

			for _, m := range meds {
				if m.Quantity < 10 && m.Quantity > 0 {
					lowStock++
				}
				if m.Quantity == 0 {
					outOfStock++
				}
				totalItems += m.Quantity
			}

			c.JSON(http.StatusOK, gin.H{
				"totalProducts": len(meds),
				"lowStock":      lowStock,
				"outOfStock":    outOfStock,
				"totalItems":    totalItems,
			})
		})

		// --- IMPORTACIÓN Y MANTENIMIENTO ---
		api.POST("/medications/import", func(c *gin.Context) {
			location := "magdaleno"
			if u := getUserFromContext(c); u != nil {
				location = u.InventoryLocation
			}

			var items []map[string]interface{}
			if err := c.ShouldBindJSON(&items); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "Formato inválido"})
				return
			}

			families, err := storage.GetFamilies(location)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Error leyendo familias"})
				return
			}

			validFamilyIds := make(map[int]bool)
			for _, f := range families {
				validFamilyIds[f.ID] = true
			}

			var sanitizedItems []map[string]interface{}
			for _, item := range items {
				var famID *int
				if v, ok := item["familyId"]; ok && v != nil {
					var id int
					switch val := v.(type) {
					case float64:
						id = int(val)
					case string:
						id, _ = strconv.Atoi(val)
					}
					if validFamilyIds[id] {
						famID = &id
					}
				}

				name := "Medicamento sin nombre"
				if n, ok := item["name"].(string); ok && strings.TrimSpace(n) != "" {
					name = n
				}

				dose := "N/A"
				if d, ok := item["dose"].(string); ok && strings.TrimSpace(d) != "" {
					dose = d
				}

				presentation := "N/A"
				if p, ok := item["presentation"].(string); ok && strings.TrimSpace(p) != "" {
					presentation = p
				}

				quantity := 0
				if q, ok := item["quantity"]; ok {
					switch val := q.(type) {
					case float64:
						quantity = int(val)
					case string:
						quantity, _ = strconv.Atoi(val)
					}
				}

				sanitizedItem := map[string]interface{}{
					"name":              name,
					"dose":              dose,
					"presentation":      presentation,
					"quantity":          quantity,
					"inventoryLocation": location,
				}
				if famID != nil {
					sanitizedItem["familyId"] = *famID
				}

				sanitizedItems = append(sanitizedItems, sanitizedItem)
			}

			if err := storage.ImportMedications(sanitizedItems, location); err != nil {
				log.Println("Error en importación de medicamentos:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"message": "Error interno en servidor", "error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Importación exitosa", "count": len(sanitizedItems)})
		})
	}
}

func main() {
	// Inicializa la base de datos y storage
	db := InitDatabase()
	storage = NewDatabaseStorage(db)

	router := gin.Default()
	RegisterRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server running on port %s", port)
	router.Run(":" + port)
}
