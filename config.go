package main

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Database DatabaseConfig `yaml:"database" json:"database"`
	Server   ServerConfig   `yaml:"server" json:"server"`
	JWT      JWTConfig      `yaml:"jwt" json:"jwt"`
}

type DatabaseConfig struct {
	Host          string `yaml:"host" json:"host"`
	Port          string `yaml:"port" json:"port"`
	User          string `yaml:"user" json:"user"`
	Password      string `yaml:"password" json:"password"`
	DBName        string `yaml:"dbname" json:"dbname"`
	SSLMode       string `yaml:"sslmode" json:"sslmode"`
	ConnectionURL string `yaml:"connection_url" json:"connection_url"`
}

type ServerConfig struct {
	Port string `yaml:"port" json:"port"`
}

type JWTConfig struct {
	SecretKey string `yaml:"secret_key" json:"secret_key"`
}

func LoadConfig(configPath string) (*Config, error) {
	config := &Config{
		Database: DatabaseConfig{
			Host:     "localhost",
			Port:     "5432",
			User:     "postgres",
			Password: "postgres",
			DBName:   "chatdb",
			SSLMode:  "disable",
		},
		Server: ServerConfig{
			Port: "8080",
		},
		JWT: JWTConfig{
			SecretKey: "your-secret-key-change-in-production",
		},
	}

	if configPath != "" {
		if err := loadConfigFromFile(configPath, config); err != nil {
			if os.IsNotExist(err) {
				return nil, err
			}
			return nil, fmt.Errorf("failed to load config file: %w", err)
		}
	}

	overrideFromEnv(config)

	return config, nil
}

func loadConfigFromFile(path string, config *Config) error {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return err
		}
		return err
	}

	if err := yaml.Unmarshal(data, config); err != nil {
		return fmt.Errorf("failed to parse config file as YAML: %w", err)
	}

	return nil
}

func overrideFromEnv(config *Config) {
	if host := os.Getenv("DB_HOST"); host != "" {
		config.Database.Host = host
	}
	if port := os.Getenv("DB_PORT"); port != "" {
		config.Database.Port = port
	}
	if user := os.Getenv("DB_USER"); user != "" {
		config.Database.User = user
	}
	if password := os.Getenv("DB_PASSWORD"); password != "" {
		config.Database.Password = password
	}
	if dbname := os.Getenv("DB_NAME"); dbname != "" {
		config.Database.DBName = dbname
	}
	if sslmode := os.Getenv("DB_SSLMODE"); sslmode != "" {
		config.Database.SSLMode = sslmode
	}
	if url := os.Getenv("DATABASE_URL"); url != "" {
		config.Database.ConnectionURL = url
	}

	if port := os.Getenv("PORT"); port != "" {
		config.Server.Port = port
	}

	if secret := os.Getenv("JWT_SECRET_KEY"); secret != "" {
		config.JWT.SecretKey = secret
	}
}

func (c *DatabaseConfig) GetDSN() string {
	if c.ConnectionURL != "" {
		return c.ConnectionURL
	}

	return fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		c.Host, c.User, c.Password, c.DBName, c.Port, c.SSLMode)
}
