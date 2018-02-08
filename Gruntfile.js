module.exports = function(grunt) {

  grunt.initConfig({
    'json-minify': {
      build: {
        files: 'dist/mathmaps/*/*.js'
      }
    },
    gitclone: {
      'speech-rule-engine': {
        options: {
          repository: 'https://github.com/zorkow/speech-rule-engine.git',
          branch: 'v2.2.1',
          cwd: '.'
        }
      }
    },
    'uglify': {
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
        },
        options: {
          beautify: {
            ascii_only: true
          }
        }
      }
    },
    shell: {
      clean_dist: {
        command: 'rm -rf dist'
      },
      make_dist: {
        command: 'mkdir -p dist'
      },
      clean_sre: {
        command: 'rm -rf speech-rule-engine'
      },
      clean_node: {
        command: 'rm -rf node_modules'
      },
      prepare: {
        command: [
          '<%= shell.clean_dist.command %>',
          '<%= shell.make_dist.command %>'
        ].join('&&')
      },
      clean: {
        command: [
          '<%= shell.clean_node.command %>',
          '<%= shell.clean_sre.command %>',
          '<%= shell.clean_dist.command %>'
        ].join('&&')
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
        'rm dist/mathmaps/math_map.js',
        'rm dist/mathmaps/.htaccess'
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
    'shell:clean_sre'
  ]);

};
