#!/usr/bin/env groovy
pipeline {
    agent any
    stages {
        stage('Checkout Stage') {
            steps {
                sh 'echo "do the checkout"'
                git branch 'pipeline',
                  credentialsId: 'c0ab267b-f59a-4c54-9e7a-e4cc906e402b',
                  url: 'ssh://git@github.com:oxygenxml/web-author-charpicker-plugin.git'
                sh 'ls -lat'
            }
        }
    }
}