/**
 * Gruntfile.js
 *
 * Copyright (c) 2012 quickcue
 */


module.exports = function(grunt) {
    // Load dev dependencies
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take for build time optimizations
    require('time-grunt')(grunt);

    // Configure the app path
    var base = 'app';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bowercopy: grunt.file.readJSON('bowercopy.json'),
        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                livereload: 35729,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    open: true,
                    base: [base]
                }
            }
        },
        includes: {
            js: {
                files: [{
                    src: 'app/js/main.js',
                    dest: 'app/app.js',
                }]
            }
        },
        watch: {
            // Live reload
            reload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    'app/js/*.js',
                    '<%= watch.json.files %>',
                    base + '/css/**/*.css',
                    '**/*.html'
                ]
            },
            js: {
                files: ['app/js/*.js'],
                tasks: ['includes:js']
            },
        }
    });

    grunt.registerTask('serve', function() {
        grunt.task.run([
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('default', ['serve']);
};
