#!/usr/bin/env groovy
pipeline {
    agent any
    tools {
        maven 'Maven 3.6.1'
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
            sh 'npm install'
            sh 'echo "do the build with maven"'
            sh 'mvn --version'
            sh 'mvn -U clean install'
          }
        }
    }
}