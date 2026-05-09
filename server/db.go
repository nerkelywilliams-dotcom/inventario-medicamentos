package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB es la instancia global de la base de datos
var DB *gorm.DB

// InitDatabase inicializa la conexión a PostgreSQL con una lógica equivalente a db.ts
func InitDatabase() *gorm.DB {
	// 1. Cargar variables de entorno (Equivalente a dotenv.config())
	err := godotenv.Load()
	if err != nil {
		log.Println("Aviso: No se pudo encontrar el archivo .env, se usarán las variables de entorno del sistema")
	}

	// 2. Obtener y validar DATABASE_URL
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL must be set. Did you forget to provision a database?")
	}

	// 3. Configuración de conexión
	// En Go/GORM, los parámetros de SSL se pasan directamente en la cadena DSN.
	// Si la URL de Render ya incluye sslmode=require, GORM lo tomará.
	// Si no, forzamos los parámetros necesarios para compatibilidad con Render.
	dsn := databaseURL

	// 4. Abrir conexión con GORM
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Error al conectar a la base de datos: %v", err)
	}

	// 5. Configuración del Pool de conexiones
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Error al obtener el pool de SQL: %v", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	fmt.Println("✅ Conexión a la base de datos establecida exitosamente")

	// 6. Ejecutar migraciones automáticas según los modelos definidos
	err = db.AutoMigrate(&User{}, &Family{}, &MedicationCatalog{}, &Medication{}, &Log{})
	if err != nil {
		log.Printf("Aviso en AutoMigrate: %v", err)
	}

	DB = db
	return db
}
