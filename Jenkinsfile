#!/usr/bin/env groovy
pipeline {
    agent {
      label 'docker'
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
                sh 'cat resources/.npmrc'
            }
            sh '''echo "{
                  \\"proxy\\": \\"http://10.0.0.18:3128\\",
                  \\"https-proxy\\": \\"http://10.0.0.18:3128\\"
              }" > resources/.npmrc'''
            sh 'npm install'
            sh 'echo "do the build with maven"'
            sh 'mvn --version'
            sh 'mvn -U clean install'
          }
        }
    }
}