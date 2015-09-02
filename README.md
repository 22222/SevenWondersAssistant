Seven Wonders Assistant
============================
A scoring assistant for the 7 Wonders board game.

This is the source code used in an [Android app](https://play.google.com/store/apps/details?id=com.twotwotwotwo.sevenwonders).

Try it now: [web version](http://22222.github.io/SevenWondersAssistant/www/index.html)


Source Overview
---------------
There are three main directories in this project:

* `src`: all of the actual source code that is unique to this app
* `cordova`: the config file and resources for the Cordova build
* `www`: the output of the build process, to be used directly as a web page or as resources in the Cordova build

This project uses several other open source libraries, including:
* [jQuery Mobile](https://jquerymobile.com/)
* [Knockout](http://knockoutjs.com/)

This thing was originally written in 2012, and it's still on version 1.2 of jQuery Mobile.  And that's probably where it will stay for a long time, since things have changed enough that it isn't very simple to upgrade to the latest version.  And if I were to do a major update, I'd probably try switching to Angular 2 and Bootstrap.  Or whatever the cool new things are in the future.


Build
-----
This project uses [Bower](http://bower.io) for its web-based dependencies and [Gulp](http://gulpjs.com/) to package everything up.  And then [Cordova](https://cordova.apache.org/) is used to create the Android app.

The basic build steps are:

* Use [npm](https://www.npmjs.com) to update the gulp dependencies: `npm update`
* Update the bower dependencies: `bower update`
* Build everything with gulp: `gulp`

And for the Android app, the steps are something like this:

* `gulp package-cordova`
* `cd cordova`
* `cordova platform add android`
* `cordova build android --release`

No guarantees that these steps are perfect or that they won't become obsolete over time (especially the Cordova part).


