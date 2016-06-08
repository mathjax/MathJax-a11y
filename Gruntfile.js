module.exports = function(grunt) {

  grunt.initConfig({
    'json-minify': {
      build: {
        files: 'dist/mathmaps/**/*.json'
      }
    },
    gitclone: {
      'speech-rule-engine': {
        options: {
          repository: 'https://github.com/zorkow/speech-rule-engine.git',
          branch: 'develop',
          cwd: "."
        }
      }
    },    'uglify': {
      mathmaps: {
        files: {
          'dist/mathmaps/mathmaps_ie.js': 'dist/mathmaps/mathmaps_ie.js'
        }
      },
      build: {
        files: {
          'dist/accessibility-menu.js': 'extensions/accessibility-menu.js',
          'dist/explorer.js': 'extensions/explorer.js',
          'dist/auto-collapse.js': 'extensions/auto-collapse.js',
          'dist/collapsible.js': 'extensions/collapsible.js',
          'dist/semantic-enrich.js': 'extensions/semantic-enrich.js'
        }
      }
    },
    shell: {
      prepare: {
        command: 'rm -f dist/*.js; rm -rf dist/mathmaps; rm -f dist/*.mp3; rm -f dist/*.ogg' //; rm -rf node_modules/speech-rule-engine'
      },
      clean: {
        command: 'rm -rf speech-rule-engine'
      },
      compile: {
        command: [
          'npm install',
          'npm install --only=dev',
          'npm install wicked-good-xpath',
          'make mathjax'
        ].join('&&'),
        options: {
          execOptions: {
            cwd: 'speech-rule-engine'
          }
        }
      },
      copy: [
        'cp speech-rule-engine/lib/mathjax-sre.js dist/mathjax-sre.js',
        'cp speech-rule-engine/node_modules/wicked-good-xpath/dist/wgxpath.install.js dist/',
        'cp -R speech-rule-engine/src/mathmaps dist/',
        'cp extensions/*.ogg dist/',
        'cp extensions/*.mp3 dist/',
        'rm dist/mathmaps/math_map.js'
      ].join('&&')
    }
  });

  // Cloning git repos.
  grunt.loadNpmTasks('grunt-git');
  // Run shell commands.
  grunt.loadNpmTasks('grunt-shell');
  // Minify JSON files.
  grunt.loadNpmTasks('grunt-json-minify');
  // Minify regular files.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', [
    'shell:prepare',
    'gitclone',
    'shell:compile',
    'shell:copy',
    'json-minify',
    'uglify',
    'shell:clean'
  ]);

};
