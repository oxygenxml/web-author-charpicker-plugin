#!/usr/bin/env groovy
pipeline {
    agent {
      label 'docker'
    }
    options {
      timestamps()
    }
    tools {
        maven 'Automatic'
    }
    stages {
        stage('Checkout Stage') {
            steps {
                sh 'echo "do the checkout"'
                sh 'ls -lat'
            }
        }
        stage('Build stage') {
          steps {
            nodejs(nodeJSInstallationName: 'node-8.5.0') {
                sh 'npm config ls'
                sh 'npm --version'
                sh '''echo "{
                    \\"proxy\\": \\"http://10.0.0.18:3128\\",
                    \\"https-proxy\\": \\"http://10.0.0.18:3128\\"
                }" > resources/.npmrc'''
                sh 'npm install'
            }
            configFileProvider([configFile(fileId: '72047525-2c3c-4aac-aa21-2a813a9e9cf7', variable: 'MAVEN_SETTINGS_XML')]) {
                sh 'echo "do the build with maven"'
                sh 'mvn --version'
                sh 'mvn -U -s $MAVEN_SETTINGS_XML clean install'
            }
          }
        }
    }
}