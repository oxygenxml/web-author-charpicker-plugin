#!/usr/bin/env groovy
pipeline {
    agent {
      label 'docker'
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
                sh 'echo "do the build with maven"'
                withMaven(
                        // Maven installation declared in the Jenkins "Global Tool Configuration"
                        maven: 'Automatic',
                        // Use `$WORKSPACE/.repository` for local repository folder to avoid shared repositories
                        // mavenLocalRepo: '.repository',
                        mavenSettingsConfig: 'SyncDefaultMavenSettingsWithProxy'
                    ) {
                  sh 'mvn --version'
                  sh 'mvn -U clean install'
                }
            }
        }
    }
}