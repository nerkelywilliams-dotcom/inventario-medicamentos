package main

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

// ==========================================
// 1. MODELOS DE BASE DE DATOS (Equivalente al Schema de Drizzle)
// ==========================================

type User struct {
	ID                int    `gorm:"primaryKey" json:"id"`
	Username          string `gorm:"uniqueIndex;not null" json:"username"`
	Password          string `gorm:"not null" json:"password,omitempty"`
	IsAdmin           bool   `gorm:"default:false" json:"isAdmin"`
	Role              string `gorm:"not null" json:"role"`
	InventoryLocation string `gorm:"not null" json:"inventoryLocation"`
}

type Family struct {
	ID                int    `gorm:"primaryKey" json:"id"`
	Name              string `gorm:"not null" json:"name"`
	InventoryLocation string `gorm:"not null" json:"inventoryLocation"`
}

type MedicationCatalog struct {
	ID                  int     `gorm:"primaryKey" json:"id"`
	Name                string  `gorm:"uniqueIndex;not null" json:"name"`
	Description         *string `json:"description"`
	MechanismOfAction   *string `json:"mechanismOfAction"`
	Indications         *string `json:"indications"`
	Posology            *string `json:"posology"`
	AdministrationRoute *string `json:"administrationRoute"`
	Contraindications   *string `gorm:"default:'No especificadas'" json:"contraindications"`
	Interactions        *string `gorm:"default:'No especificadas'" json:"interactions"`
	ImageUrl            *string `json:"imageUrl"`
}

type Medication struct {
	ID                int               `gorm:"primaryKey" json:"id"`
	CatalogID         int               `gorm:"not null" json:"catalogId"`
	Catalog           MedicationCatalog `gorm:"foreignKey:CatalogID" json:"catalog"`
	FamilyID          *int              `json:"familyId"`
	Family            *Family           `gorm:"foreignKey:FamilyID" json:"family"`
	Dose              string            `gorm:"default:'Ver empaque'" json:"dose"`
	Presentation      string            `gorm:"not null" json:"presentation"`
	Quantity          int               `gorm:"default:0" json:"quantity"`
	ExpirationDate    *string           `json:"expirationDate"`
	IsPediatric       bool              `gorm:"default:false" json:"isPediatric"`
	InventoryLocation string            `gorm:"not null" json:"inventoryLocation"`
	CreatedAt         time.Time         `gorm:"autoCreateTime" json:"createdAt"`
}

type Log struct {
	ID                int       `gorm:"primaryKey" json:"id"`
	Action            string    `gorm:"not null" json:"action"`
	Details           string    `gorm:"not null" json:"details"`
	UserID            *int      `json:"userId"`
	User              *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MedicationName    string    `gorm:"not null" json:"medicationName"`
	MedicationID      *int      `json:"medicationId"`
	InventoryLocation string    `gorm:"default:'magdaleno'" json:"inventoryLocation"`
	Timestamp         time.Time `gorm:"autoCreateTime" json:"timestamp"`
}

// ==========================================
// 2. INTERFAZ IStorage
// ==========================================

type IStorage interface {
	// Medication Catalog
	GetMedicationCatalogs() ([]MedicationCatalog, error)
	GetMedicationCatalog(id int) (*MedicationCatalog, error)
	GetMedicationCatalogByName(name string) (*MedicationCatalog, error)
	GetMedicationCatalogBySearch(searchTerm string) (*MedicationCatalog, error)
	CreateMedicationCatalog(catalog MedicationCatalog) (*MedicationCatalog, error)
	UpdateMedicationCatalog(id int, catalog map[string]interface{}) (*MedicationCatalog, error)

	// Families
	GetFamilies(inventoryLocation string) ([]Family, error)
	GetFamily(id int) (*Family, error)
	CreateFamily(family Family) (*Family, error)
	UpdateFamily(id int, family map[string]interface{}) (*Family, error)
	DeleteFamily(id int) error

	// Medications
	GetMedications(search string, familyId string, inventoryLocation string) ([]Medication, error)
	GetMedication(id int) (*Medication, error)
	CreateMedication(medication Medication) (*Medication, error)
	UpdateMedication(id int, medication map[string]interface{}) (*Medication, error)
	DeleteMedication(id int) error
	ImportMedications(items []map[string]interface{}, inventoryLocation string) error
	DeleteAllMedications(inventoryLocation string) error

	// Users
	GetUsers(inventoryLocation string) ([]User, error)
	GetUserByUsername(username string) (*User, error)
	CreateUser(user User) (*User, error)
	DeleteUser(id int) error

	// Logs (Bitácora)
	CreateLog(log Log) (*Log, error)
	GetRecentLogs(inventoryLocation string, limit int) ([]Log, error)
}

// ==========================================
// 3. IMPLEMENTACIÓN DatabaseStorage
// ==========================================

type DatabaseStorage struct {
	db *gorm.DB
}

func NewDatabaseStorage(db *gorm.DB) *DatabaseStorage {
	return &DatabaseStorage{db: db}
}

// --- MEDICATION CATALOG ---

func (s *DatabaseStorage) GetMedicationCatalogs() ([]MedicationCatalog, error) {
	var catalogs []MedicationCatalog
	err := s.db.Order("name ASC").Find(&catalogs).Error
	return catalogs, err
}

func (s *DatabaseStorage) GetMedicationCatalog(id int) (*MedicationCatalog, error) {
	var catalog MedicationCatalog
	err := s.db.First(&catalog, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &catalog, err
}

func (s *DatabaseStorage) GetMedicationCatalogByName(name string) (*MedicationCatalog, error) {
	var catalog MedicationCatalog
	err := s.db.Where("name ILIKE ?", name).First(&catalog).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &catalog, err
}

func (s *DatabaseStorage) GetMedicationCatalogBySearch(searchTerm string) (*MedicationCatalog, error) {
	var catalog MedicationCatalog
	err := s.db.Where("name ILIKE ?", "%"+searchTerm+"%").First(&catalog).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &catalog, err
}

func (s *DatabaseStorage) CreateMedicationCatalog(catalog MedicationCatalog) (*MedicationCatalog, error) {
	err := s.db.Create(&catalog).Error
	return &catalog, err
}

func (s *DatabaseStorage) UpdateMedicationCatalog(id int, updates map[string]interface{}) (*MedicationCatalog, error) {
	var catalog MedicationCatalog
	if err := s.db.First(&catalog, id).Error; err != nil {
		return nil, err
	}
	err := s.db.Model(&catalog).Updates(updates).Error
	return &catalog, err
}

// --- FAMILIES ---

func (s *DatabaseStorage) GetFamilies(inventoryLocation string) ([]Family, error) {
	var families []Family
	query := s.db
	if inventoryLocation != "" {
		query = query.Where("inventory_location = ?", inventoryLocation)
	}
	err := query.Find(&families).Error
	return families, err
}

func (s *DatabaseStorage) GetFamily(id int) (*Family, error) {
	var family Family
	err := s.db.First(&family, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &family, err
}

func (s *DatabaseStorage) CreateFamily(family Family) (*Family, error) {
	err := s.db.Create(&family).Error
	return &family, err
}

func (s *DatabaseStorage) UpdateFamily(id int, updates map[string]interface{}) (*Family, error) {
	var family Family
	if err := s.db.First(&family, id).Error; err != nil {
		return nil, err
	}
	err := s.db.Model(&family).Updates(updates).Error
	return &family, err
}

func (s *DatabaseStorage) DeleteFamily(id int) error {
	return s.db.Delete(&Family{}, id).Error
}

// --- MEDICATIONS ---

func (s *DatabaseStorage) GetMedications(search string, familyId string, inventoryLocation string) ([]Medication, error) {
	var meds []Medication
	query := s.db.Preload("Catalog").Preload("Family").Order("created_at DESC")

	if familyId != "" {
		query = query.Where("family_id = ?", familyId)
	}
	if inventoryLocation != "" {
		query = query.Where("inventory_location = ?", inventoryLocation)
	}

	if err := query.Find(&meds).Error; err != nil {
		return nil, err
	}

	if search != "" {
		var filtered []Medication
		searchLower := strings.ToLower(search)
		for _, m := range meds {
			catName := strings.ToLower(m.Catalog.Name)
			var catInd string
			if m.Catalog.Indications != nil {
				catInd = strings.ToLower(*m.Catalog.Indications)
			}

			if strings.Contains(catName, searchLower) || strings.Contains(catInd, searchLower) {
				filtered = append(filtered, m)
			}
		}
		return filtered, nil
	}

	return meds, nil
}

func (s *DatabaseStorage) GetMedication(id int) (*Medication, error) {
	var med Medication
	err := s.db.Preload("Catalog").Preload("Family").First(&med, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &med, err
}

func (s *DatabaseStorage) CreateMedication(data Medication) (*Medication, error) {
	var catalogEntry MedicationCatalog

	err := s.db.Transaction(func(tx *gorm.DB) error {
		err := tx.Where("name = ?", data.Catalog.Name).First(&catalogEntry).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			catalogEntry = data.Catalog
			if catalogEntry.Contraindications == nil {
				def := "No especificadas"
				catalogEntry.Contraindications = &def
			}
			if catalogEntry.Interactions == nil {
				def := "No especificadas"
				catalogEntry.Interactions = &def
			}
			if err := tx.Create(&catalogEntry).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		}

		data.CatalogID = catalogEntry.ID
		if data.Dose == "" {
			data.Dose = "Ver empaque"
		}
		data.Catalog = MedicationCatalog{}

		return tx.Create(&data).Error
	})

	if err != nil {
		return nil, err
	}

	return s.GetMedication(data.ID)
}

func (s *DatabaseStorage) UpdateMedication(id int, updates map[string]interface{}) (*Medication, error) {
	current, err := s.GetMedication(id)
	if err != nil || current == nil {
		return nil, errors.New("medicamento no encontrado")
	}

	err = s.db.Transaction(func(tx *gorm.DB) error {
		catalogUpdates := make(map[string]interface{})
		for _, key := range []string{"name", "description", "mechanismOfAction", "indications", "posology", "administrationRoute", "contraindications", "interactions", "imageUrl"} {
			if val, exists := updates[key]; exists {
				catalogUpdates[key] = val
				delete(updates, key)
			}
		}

		if len(catalogUpdates) > 0 {
			if err := tx.Model(&MedicationCatalog{}).Where("id = ?", current.CatalogID).Updates(catalogUpdates).Error; err != nil {
				return err
			}
		}

		if len(updates) > 0 {
			if err := tx.Model(&Medication{}).Where("id = ?", id).Updates(updates).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return s.GetMedication(id)
}

func (s *DatabaseStorage) DeleteMedication(id int) error {
	return s.db.Delete(&Medication{}, id).Error
}

func (s *DatabaseStorage) ImportMedications(items []map[string]interface{}, inventoryLocation string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range items {
			name, _ := item["name"].(string)
			presentation, _ := item["presentation"].(string)
			if presentation == "" {
				presentation = "N/A"
			}
			dose, _ := item["dose"].(string)
			if dose == "" {
				dose = "N/A"
			}

			var catalogEntry MedicationCatalog
			err := tx.Where("name = ?", name).First(&catalogEntry).Error

			if errors.Is(err, gorm.ErrRecordNotFound) {
				catalogEntry = MedicationCatalog{Name: name}
				if v, ok := item["description"].(string); ok {
					catalogEntry.Description = &v
				}
				if v, ok := item["mechanismOfAction"].(string); ok {
					catalogEntry.MechanismOfAction = &v
				}
				if v, ok := item["indications"].(string); ok {
					catalogEntry.Indications = &v
				}
				if v, ok := item["posology"].(string); ok {
					catalogEntry.Posology = &v
				}
				if v, ok := item["administrationRoute"].(string); ok {
					catalogEntry.AdministrationRoute = &v
				}

				contra := "No especificadas"
				if v, ok := item["contraindications"].(string); ok && v != "" {
					contra = v
				}
				catalogEntry.Contraindications = &contra

				interact := "No especificadas"
				if v, ok := item["interactions"].(string); ok && v != "" {
					interact = v
				}
				catalogEntry.Interactions = &interact

				if v, ok := item["imageUrl"].(string); ok {
					catalogEntry.ImageUrl = &v
				}

				if err := tx.Create(&catalogEntry).Error; err != nil {
					return err
				}
			} else if err == nil {
				catUpdates := make(map[string]interface{})
				for _, key := range []string{"description", "mechanismOfAction", "indications", "posology", "administrationRoute", "contraindications", "interactions", "imageUrl"} {
					if val, ok := item[key].(string); ok && strings.TrimSpace(val) != "" {
						catUpdates[key] = val
					}
				}
				if len(catUpdates) > 0 {
					tx.Model(&catalogEntry).Updates(catUpdates)
				}
			} else {
				return err
			}

			var familyID *int
			if famVal, ok := item["familyId"]; ok && famVal != nil {
				if fFloat, ok := famVal.(float64); ok {
					fInt := int(fFloat)
					familyID = &fInt
				}
			}

			var existingMed Medication
			query := tx.Where("catalog_id = ? AND inventory_location = ?", catalogEntry.ID, inventoryLocation)

			if presentation != "N/A" {
				query = query.Where("presentation = ?", presentation)
			}
			if dose != "N/A" {
				query = query.Where("dose = ?", dose)
			}
			if familyID != nil {
				query = query.Where("family_id = ?", familyID)
			}

			err = query.First(&existingMed).Error

			quantity := 0
			if qVal, ok := item["quantity"].(float64); ok {
				quantity = int(qVal)
			}

			var incomingExp *string
			if exp, ok := item["expirationDate"].(string); ok && exp != "" {
				incomingExp = &exp
			}

			isPediatric := false
			if pVal, ok := item["isPediatric"].(bool); ok {
				isPediatric = pVal
			}

			if err == nil {
				updatedQuantity := existingMed.Quantity + quantity

				finalExpDate := existingMed.ExpirationDate
				if existingMed.ExpirationDate != nil && incomingExp != nil {
					t1, _ := time.Parse(time.RFC3339, *existingMed.ExpirationDate)
					t2, _ := time.Parse(time.RFC3339, *incomingExp)
					if !t1.IsZero() && !t2.IsZero() && t2.Before(t1) {
						finalExpDate = incomingExp
					}
				} else if incomingExp != nil {
					finalExpDate = incomingExp
				}

				updates := map[string]interface{}{
					"quantity":       updatedQuantity,
					"expirationDate": finalExpDate,
				}
				if item["isPediatric"] != nil {
					updates["isPediatric"] = isPediatric
				}
				if familyID != nil {
					updates["familyId"] = familyID
				}

				if err := tx.Model(&existingMed).Updates(updates).Error; err != nil {
					return err
				}
			} else if errors.Is(err, gorm.ErrRecordNotFound) {
				newMed := Medication{
					CatalogID:         catalogEntry.ID,
					FamilyID:          familyID,
					Dose:              dose,
					Presentation:      presentation,
					Quantity:          quantity,
					ExpirationDate:    incomingExp,
					IsPediatric:       isPediatric,
					InventoryLocation: inventoryLocation,
				}
				if err := tx.Create(&newMed).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
		return nil
	})
}

func (s *DatabaseStorage) DeleteAllMedications(inventoryLocation string) error {
	return s.db.Where("inventory_location = ?", inventoryLocation).Delete(&Medication{}).Error
}

// --- USERS ---

func (s *DatabaseStorage) GetUsers(inventoryLocation string) ([]User, error) {
	var users []User
	query := s.db
	if inventoryLocation != "" {
		query = query.Where("inventory_location = ?", inventoryLocation)
	}
	err := query.Find(&users).Error
	return users, err
}

func (s *DatabaseStorage) GetUserByUsername(username string) (*User, error) {
	var user User
	err := s.db.Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (s *DatabaseStorage) CreateUser(user User) (*User, error) {
	err := s.db.Create(&user).Error
	return &user, err
}

func (s *DatabaseStorage) DeleteUser(id int) error {
	return s.db.Delete(&User{}, id).Error
}

// --- LOGS ---

func (s *DatabaseStorage) CreateLog(logData Log) (*Log, error) {
	if logData.UserID == nil {
		var adminUser User
		if err := s.db.Where("username = ?", "admin_mag").First(&adminUser).Error; err == nil {
			logData.UserID = &adminUser.ID
		}
	}

	if logData.Action == "" {
		logData.Action = "ACTUALIZACIÓN"
	}
	if logData.Details == "" {
		logData.Details = "Cambio en inventario"
	}
	if logData.MedicationName == "" {
		logData.MedicationName = "Medicamento"
	}
	if logData.InventoryLocation == "" {
		logData.InventoryLocation = "magdaleno"
	}

	err := s.db.Create(&logData).Error
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "42703") || strings.Contains(errStr, "medication_id") {
			errFallback := s.db.Omit("MedicationID").Create(&logData).Error
			return &logData, errFallback
		}
		return nil, err
	}

	return &logData, nil
}

func (s *DatabaseStorage) GetRecentLogs(inventoryLocation string, limit int) ([]Log, error) {
	var logs []Log
	if limit == 0 {
		limit = 50
	}

	err := s.db.Preload("User").Order("timestamp DESC").Limit(limit).Find(&logs).Error

	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "42703") || strings.Contains(errStr, "medication_id") || strings.Contains(errStr, "inventory_location") {
			errFallback := s.db.Omit("MedicationID", "InventoryLocation").Preload("User").Order("timestamp DESC").Limit(limit).Find(&logs).Error
			if errFallback != nil {
				return nil, errFallback
			}
		} else {
			return nil, err
		}
	}

	if inventoryLocation != "" {
		var filtered []Log
		locLower := strings.ToLower(inventoryLocation)
		for _, l := range logs {
			if l.InventoryLocation == "" || strings.ToLower(l.InventoryLocation) == locLower {
				filtered = append(filtered, l)
			}
		}
		return filtered, nil
	}

	return logs, nil
}
