pipeline {
  agent any

  stages {
    stage("test") {
      steps {
        echo 'Testing...'
      }
    }

    stage("build") {
      steps {
        echo 'Building...'
      }
    }
    stage("deploy") {
      steps {
        echo 'Deploying...'
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