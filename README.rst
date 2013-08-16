Leanorama - a jQuery plugin for displaying and navigating Virtual Tours based on panoramic images
=================================================================================================
*Leanorama is essentially abandonware. That means Leandigo is no longer actively developing this. Still, pull requests will be accepted.*

What is this
------------
Look at the `Demo`_.

Leanorama started as a client-side infrastructure component of a *virtual tour* product.

Leanorama allows navigation inside equirectangular_-turned-`cubic`_ panoramic images on HTML5 websites. As a jQuery plugin,
it's easy to embed and configure. It's working on modern **webkit** browsers, including mobile browsers of iOS 4+ and
Android 3+, and IE10.

Features
--------
At the time of writing, Leanorama is the first and only 100% HTML5/CSS3/JavaScript panorama viewer available as a
standalone solution. It doesn't require paying for a specific software or service in order to be used.

All you need is some very basic HTML/JavaScript skills, and a cubic_ remap of an equirectangular_ panoramic image.
You'll be able to create virtual tours supporting:

* Works on Safari, Chrome, Internet Explorer 10+
* 3D immersive rendition of cubic panorama images
* *Pitch*, *yaw* and *zoom* view manipulation
* Control inputs: keyboard, mouse, touch, orientation (accelerometer or gyro on mobile devices)
* Yes, that means it works on phones and tablets - you can hold them and look around
* Controls bar with on-screen buttons (via extension)
* Hotspots for navigaion, information and links (via extension)
* Title and description (via extension)

I say "via extension" a lot. That's because you can write your own extensions for leanorama using a very simple API.

Attributions
------------
The implementation is loosely inspired by this three.js demo: `<http://threejs.org/examples/css3d_panorama.html>`_
by mrdoob_.

This code is bundled with a slightly tweaked version of Transit_ by `Rico Sta. Cruz`_

The example loads panoramic photographs by:

* `Alexandre Duret-Lutz`_
* `heiwa4126`_
* `jannefoo`_

HowTo
-----
Required Scripts
````````````````
Include the required scripts (jQuery, Bootstrap, **bundled** Transit, Leanorama core) and stylesheets::

    <script src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
    <script src="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min.js"></script>
    <script src="js/jquery.transit.js"></script>
    <script src="js/jquery.leanorama.js"></script>
    <link href="http://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/leanorama.css">

Initialization Parameters
`````````````````````````
In a script, initialize Leanorama in a DOM element of your choosing::

    $('#pano').leanorama({ /* ... params ... */ })

.. csv-table:: Supported Initialization Parameters
    :header: Parameter, Type, Default, Description
    :widths: 15, 10, 15, 60

    ``sides``,      Array,      ,     "**(required)** URLs for the panorama images: [right, back, left, front, up, down]"
    ``limit``,      object,     "``{ top: 85, bottom: -85, right: 999, left: -999 }``", "Field of vision limits in degrees"
    ``lon``,        number,     0,      "Initial yaw angle"
    ``lat``,        number,     0,      "Initial pitch angle"
    ``scale``,      number,     1,      "Initial zoom factor"
    ``autorotate``, number,     0,      "Initial autorotation speed"
    ``fading``,     boolean,    true,   "Enable fade in/out when starting/stopping"
    ``mouse``,      boolean,    true,   "Enable mouse controls"
    ``kbd``,        boolean,    true,   "Enable keyboard controls"
    ``touch``,      boolean,    true,   "Enable touch controls"
    ``gyro``,       boolean,    true,   "Enable gyro/accelerometer controls"
    ``delay``,      integer,    25,     "Delay in milliseconds between view updates(frames)"

Control Bar Extension
`````````````````````
This displays a collapsible controls toolbar at the lower-left corner of the panorama object.

Add the control bar extension and CSS::

    <script src="js/jquery.leanorama.controlbar.js"></script>
    <link rel="stylesheet" href="css/leanorama.controlbar.css">

That's it.

Infobox Extension
`````````````````
This displays a static box at the upper-right corner of the panorama object with any HTML inside.

Add the infobox extension and CSS::

    <script src="js/jquery.leanorama.infobox.js"></script>
    <link rel="stylesheet" href="css/leanorama.infobox.css">

Add the following initialization parameter to your parameters object:

.. csv-table:: Infobox Initialization Parameters
    :header: Parameter, Type, Default, Description
    :widths: 15, 10, 15, 60

    ``infobox``, string, ,The HTML that will be inserted to the infobox

Hotspot Extension
``````````````````
This lets you show hotspots on panorama's surfaces for navigation, information, links, or custom actions.

Navigation hotspots require a custom event handler. It can be a really simple function (see Example).

Link and information hotspots work out of the box.

Add the hotspot extension and CSS::

    <script src="js/jquery.leanorama.hotspot.js"></script>
    <link rel="stylesheet" href="css/leanorama.hotspot.css">

Add the following initialization parameter to your parameters object:

.. csv-table:: Hotspot Initialization Parameters
    :header: Parameter, Type, Default, Description
    :widths: 15, 10, 15, 60

    ``hotspots``, Array, , Contains hotspot definition objects

.. csv-table:: Hotspot Definition Object
    :header: Parameter, Type, Default, Description
    :widths: 15, 10, 15, 60

    ``type``, string, 'nav', "One of ['nav', 'info', 'link', 'action']"
    ``id``, string, , "The ID of the hotspot DOM element. In case you want to find it later"
    ``face``, integer, ,"The index of the side on which the hotspot should appear (0..5)"
    ``x``, number, , "The ``left`` coordinate of the hotspot on the face (0..1024)"
    ``y``, number, , "The ``top`` coordinate of the hotspot on the face (0..1024)"
    ``name``, string, , "Varies by hotspot type

    :nav: The string that appears in the tooltip
    :info: The title of the information popup
    :link: The string that appears in the tooltip"
    ``value``, string, , "Varies by hotspot type

    :nav: *Depends on event handler*
    :info: The content of the popup
    :link: The URL of the link"

Events
``````
There are many. Most are internal events you shouldn't care about. Their names are self-explanatory and you can play
with them: ``leanoramaInit, leanoramaResize, leanoramaResized, leanoramaEngineStarted, leanoramaEngineStarting,
leanoramaEngineStopped, leanoramaEngineStopping, leanoramaViewChanged, leanoramaViewTransitionStarted,
leanoramaViewTransitionStopped, leanoramaAutorotateStarted, leanoramaAutorotateStopped``.

One more useful event for developers would be ``leanoramaHotspotClick``, which is for handling hotspot clicks (DUH!),
and ``leanoramaRefresh`` which forces restart of Leanorama with updated settings. Check out the example below of how
can this be glued together.

Example
-------
This is an example virtual tour configuration script::

    var tour = {
        plaza: { // First location: Plaza
            sides: [ // URLs for panorama files
                '/path/to/plaza/right.jpg',
                '/path/to/plaza/back.jpg',
                '/path/to/plaza/left.jpg',
                '/path/to/plaza/front.jpg',
                '/path/to/plaza/up.jpg',
                '/path/to/plaza/down.jpg'
            ],
            hotspots: [ // This location has 3 hotspot: navigation, info with video, and a link
                { // Navigation hotspot which will take you to the Museum.
                    type: 'nav',
                    face: 0,
                    x: 123,
                    y: 456,
                    id: 'nav-plaza-to-museum',
                    name: 'Enter Museum',
                    value: 'museum'
                },
                { // Link to the Leanorama repository
                    type: 'link',
                    face: 2,
                    x: 42,
                    y: 460,
                    id: 'download-link',
                    name: 'Download Leanorama',
                    value:'https://github.com/leandigo/leanorama'
                },
                { // An info popup with a video
                    type: 'info',
                    face: 4,
                    x: 1000,
                    y: 1000,
                    face: 0,
                    id: 'info-video',
                    name: 'That <em>awesome</em> video!',
                    value: '<div id="blah" style="text-align: center">\
                        <iframe width="200" height="113" src="http://www.youtube.com/embed/9bZkp7q19f0" frameborder="0" allowfullscreen></iframe>\
                        <br><br>In case you have forgotten about this awesome video, here it is!<br><br>\
                        <a href="http://youtu.be/9bZkp7q19f0" class="btn btn-success" target="_blank">Watch it on YouTube</a>\
                        </div>'
                }
            ]
        },
        museum: { // Second location: Museum
            autorotate: 0.1         // When entering the location, autorotation will start
            sides: [ // URLs for panorama files
                '/path/to/museum/right.jpg',
                '/path/to/museum/back.jpg',
                '/path/to/museum/left.jpg',
                '/path/to/museum/front.jpg',
                '/path/to/museum/up.jpg',
                '/path/to/museum/down.jpg'
            ],
            hotspots: [
                { // A navigation hotspot to go back to the plaza
                    type: 'nav',
                    face: 2,
                    x: 456,
                    y: 789,
                    id: 'nav-museum-to-plaza',
                    name: 'Back to Plaza',
                    value: 'plaza'
                },
            ]
        }
    };

    // Initialize tour at the Plaza
    var pano = $('#panorama-container').leanorama(tour.plaza)

    // Change location when navigational hotspots are clicked
    pano.on('leanoramaHotspotClick', function(e, hotspot) {
        if (hotspot.type == 'nav') $(this).trigger('leanoramaRefresh', tour[hotspot.value]);
    });

You can clone a working demo from `<https://github.com/leandigo/leanorama/tree/gh-pages>`_. It contains a fully-functional
configuration script.


Custom Extensions
-----------------
This is undocumented. If you've gone through the code of the extensions we have here, and still have questions, email
us. We'll help.

Known Issues, Bugs and Limitations
----------------------------------
* Doesn't work on Firefox.
* The 6 cube faces get stretched to 1024x1024px no matter what the original resolution is.
* Accelerometers on different devices behave differently. Samsung Galaxy series and iPhone 4S and below seem to behave consistently OK.
* Window resize screws up the perspective. Resize events aren't handled.
* No fancy preloading of images. Do your own preloading.
* Desktop browsers have minor glitches with rendering of cube corners, that look like small white gaps. If you know how to fix that, let me know. *No, it's not the infamous backface visibility.*

... And probably many more.

License
-------
Copyright (c) 2013, Leandigo (`<www.leandigo.com>`_)

Released under the MIT License. See the LICENSE file for details

.. _mrdoob: http://mrdoob.com/
.. _Alexandre Duret-Lutz: http://www.flickr.com/photos/gadl/
.. _heiwa4126: http://www.flickr.com/photos/heiwa4126
.. _jannefoo: http://www.flickr.com/photos/jannefoo
.. _Demo: http://leandigo.github.io/leanorama/
.. _Leandigo: http://leandigo.com
.. _equirectangular: http://wiki.panotools.org/Equirectangular_Projection
.. _cubic: http://wiki.panotools.org/Cubic_Projection
.. _Transit: http://ricostacruz.com/jquery.transit/
.. _Rico Sta. Cruz: http://ricostacruz.com/

.. figure:: https://cruel-carlota.pagodabox.com/a7195b392baa74177cf18ae04ebec19a
   :alt: Githalytics
   :target: http://githalytics.com/leandigo/leanorama
