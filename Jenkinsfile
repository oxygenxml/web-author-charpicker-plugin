#!/usr/bin/env groovy
pipeline {
    agent any
    stages {
        stage('Checkout Stage') {
            steps {
                sh 'echo "do the checkout"'
                sh 'ls -lat'
            }
        }
        stage('Build stage') {
          steps {
            sh 'echo "do the build"'
            sh 'mvn -U clean install'
          }
        }
    }
}