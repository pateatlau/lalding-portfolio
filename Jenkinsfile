pipeline {
  agent any

  environment {
    NEW_VERSION = '1.3.0'
  }

  stages {
    stage("test") {
      steps {
        echo "testing new version ${NEW_VERSION}"
      }
    }

    stage("build") {
      steps {
        echo "building new version ${NEW_VERSION}"
      }
    }
    stage("deploy") {
      steps {
        echo "deploying new version ${NEW_VERSION}"
      }
    }
  }

  post {
    always {
      echo 'DONE!'
    }
    success {
      echo 'SUCCESS'
    }
    failure {
      echo 'FAILURE'
    }
  }
}