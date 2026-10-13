pipeline {
    agent any

    environment {
        PATH = "C:\\Users\\Hi\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin;${env.PATH}"
        IMAGE_NAME = 'attendance-app'
        CONTAINER_NAME = 'attendance-container'
        APP_PORT = '8086'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '=== Stage 1: Checkout Source Code ==='
                checkout scm
            }
        }

        stage('Automated Testing') {
            steps {
                echo '=== Stage 2: Automated Testing (Pytest / Python) ==='
                bat 'docker run --rm -v "%WORKSPACE%":/app -w /app python:3.11-alpine python test_app.py'
            }
        }

        stage('Docker Build') {
            steps {
                echo '=== Stage 3: Building Docker Image ==='
                bat 'docker build -t %IMAGE_NAME%:latest .'
            }
        }

        stage('Docker Deploy') {
            steps {
                echo '=== Stage 4: Deploying Docker Container ==='
                bat '''
                    docker stop %CONTAINER_NAME% 2>nul || ver>nul
                    docker rm %CONTAINER_NAME% 2>nul || ver>nul
                    docker run -d -p %APP_PORT%:80 --name %CONTAINER_NAME% %IMAGE_NAME%:latest
                '''
            }
        }

        stage('Verification') {
            steps {
                echo '=== Stage 5: Verifying Application Health ==='
                bat 'docker ps --filter "name=%CONTAINER_NAME%"'
                echo "Application successfully deployed at: http://localhost:${APP_PORT}"
            }
        }
    }

    post {
        success {
            echo '=== Pipeline Execution Succeeded! ==='
        }
        failure {
            echo '=== Pipeline Execution Failed! ==='
        }
    }
}

