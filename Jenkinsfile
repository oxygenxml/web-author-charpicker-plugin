#!/usr/bin/env groovy
pipeline {
    agent any
    tools {
        maven '$MAVEN_3_6_1_HOME'
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
            sh 'echo "do the build with maven $MAVEN_3_6_1_HOME"'
            sh 'mvn --version'
            sh 'mvn -U clean install'
          }
        }
    }
}