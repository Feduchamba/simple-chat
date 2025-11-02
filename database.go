package main

import (
	"fmt"
	"log"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

type User struct {
	ID       string `gorm:"primaryKey;type:uuid" json:"id"`
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

func (User) TableName() string {
	return "users"
}

func InitDB(config *Config) (*gorm.DB, error) {
	dsn := config.Database.GetDSN()

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	err = db.AutoMigrate(&User{})
	if err != nil {
		return nil, fmt.Errorf("failed to auto-migrate: %w", err)
	}

	log.Printf("Database connected to %s:%s/%s and migrated successfully",
		config.Database.Host, config.Database.Port, config.Database.DBName)
	return db, nil
}

func GetDB() *gorm.DB {
	return db
}
