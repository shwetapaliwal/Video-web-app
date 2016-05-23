function callback() {
    var controllerObj = new YoutubeController();
}

function OauthRequest() {}
OauthRequest.prototype = {
    googleApiClientReady: function() {
        var self = this;
        gapi.auth.init(function() {
            window.setTimeout(function() {
                self.checkAuth();
            }, 1);
        });
    },
    // Attempt the immediate OAuth 2 client flow as soon as the page is loaded.
    // If the currently logged in Google Account has previously authorized OAUTH2_CLIENT_ID, then
    // it will succeed with no user intervention. Otherwise, it will fail and the user interface
    // to prompt for authorization needs to be displayed.
    checkAuth: function() {
        var self = this;

        function handle(authResult) {
            self.handleAuthResult(authResult);
        }
        gapi.auth.authorize({
            client_id: 'PUT YOUR API KEY HERE',
            scope: ['https://www.googleapis.com/auth/youtube'],
            immediate: true
        }, handle);
    },
    // Handles the result of a gapi.auth.authorize() call.
    handleAuthResult: function(authResult) {
        var self = this;

        function loginCheck(authResult) {
            console.log(authResult);
            $('#login_wrapper').hide();
            self.loadAPIClientInterfaces();
        }
        if (authResult) {
            // Auth was successful; hide the things related to prompting for auth and show the things
            // that should be visible after auth succeeds.
            console.log(authResult)
            $('.pre-auth').hide();
            $('#hideBeforeLogin').css('display', 'none');
            this.loadAPIClientInterfaces();
        } else {
            // Make the #login-link clickable, and attempt a non-immediate OAuth 2 client flow.
            // The current function will be called when that flow is complete.
            $(document.body).bind('checkLogin', function(event) {
                var self = self; /* Act on the event */
                gapi.auth.authorize({
                    client_id: 'PUT YOUR API KEY HERE',
                    scope: ['https://www.googleapis.com/auth/youtube'],
                    immediate: false
                }, loginCheck);
            });
        }
    },
    // Loads the client interface for the YouTube Analytics and Data APIs.
    // This is required before using the Google APIs JS client; more info is available at
    // http://code.google.com/p/google-api-javascript-client/wiki/GettingStarted#Loading_the_Client
    loadAPIClientInterfaces: function() {
        gapi.client.load('youtube', 'v3', function() {
            //handleAPILoaded();
            $(document.body).trigger('apiRequestCompleted');
            $('#hideBeforeLogin').css('display', 'none');
        });
    }
}
oauthObj = new OauthRequest();
console.log(oauthObj);
$(document.body).bind('startAuth', function(event) {
    oauthObj.googleApiClientReady();
});
// api object that contains method for calls to search api , playlist api , subscribe api

function ApiRequest() {
    this.init();
}
ApiRequest.prototype = {
    init: function() {
        var self = this;
        $(document.body).bind('apiRequestCompleted', function(event) {
            self.handleAPILoaded();
        });
        $(document.body).bind('showLikedVideos', function(event) {
            /* Act on the event */
            self.requestVideoPlaylist(self.likesId);
        });
        $(document.body).bind('showUploadedVideos', function(event) {
            /* Act on the event */
            self.requestVideoPlaylist(self.uploadsId);
        });
        $(document.body).bind('showWatchHistoryVideos', function(event) {
            /* Act on the event */
            self.requestVideoPlaylist(self.watchHistoryId)
        });
        $(document.body).bind('showWatchLaterVideos', function(event) {
            /* Act on the event */
            self.requestVideoPlaylist(self.watchLaterId);
        });
        $(document.body).bind('showPopularVideos', function(event) {
            /* Act on the event */
            self.getPopularVideoDetails();
            $('#video_cateogry_wrapper span').html('Popular Videos');
            $('#video_cateogry_wrapper').css('display', 'block');
        });

        $(document.body).bind('showfeedsVideos', function(event) {
            /* Act on the event */
            self.getSubscribtion();
        });
        $(document.body).bind('showSearchedVideos', function(event) {
            /* Act on the event */
            self.search();
        });
    },
    handleAPILoaded: function() {
        this.requestUserPlaylistId();
    },
    //Retrieve the uploads playlist id.
    requestUserPlaylistId: function() {
        var self = this;
        // Some variables to remember state.
        var playlistId, nextPageToken, prevPageToken;
        // https://developers.google.com/youtube/v3/docs/channels/list
        var request = gapi.client.youtube.channels.list({
            // mine: '' indicates that we want to retrieve the channel for the authenticated user.
            mine: true,
            part: 'contentDetails,snippet'
        });
        request.execute(function(response) {
            console.log(response);
            self.uploadsId = response.result.items[0].contentDetails.relatedPlaylists.uploads;
            self.watchHistoryId = response.result.items[0].contentDetails.relatedPlaylists.watchHistory;
            self.watchLaterId = response.result.items[0].contentDetails.relatedPlaylists.watchLater;
            self.favoritesId = response.result.items[0].contentDetails.relatedPlaylists.favorites;
            self.likesId = response.result.items[0].contentDetails.relatedPlaylists.likes;
            self.userPic = response.result.items[0].snippet.thumbnails.
            default.url;
            self.userName = response.result.items[0].snippet.title;
            $('#userName').html(self.userName);
            $('#userPic').attr('src', self.userPic);
        });
        $(document.body).trigger('showPopularVideos');

    },
    // Retrieve a playist of videos.
    requestVideoPlaylist: function(playlistId, pageToken) {
        //$('ul.searchedVideos').html('');
        var self = this;
        var requestOptions = {
            playlistId: playlistId,
            part: 'snippet',
            maxResults: 10
        };
        if (pageToken) {
            requestOptions.pageToken = pageToken;
        }
        var request = gapi.client.youtube.playlistItems.list(requestOptions);
        request.execute(function(response) {
            console.log(response);
            // Only show the page buttons if there's a next or previous page.
            nextPageToken = response.result.nextPageToken;
            var nextVis = nextPageToken ? 'visible' : 'hidden';
            $('#next-button').css('visibility', nextVis);
            prevPageToken = response.result.prevPageToken
            var prevVis = prevPageToken ? 'visible' : 'hidden';
            $('#prev-button').css('visibility', prevVis);
            self.getVideoIds(response);
        });
    },
    //getVideoDetails(id)
    getVideoIds: function(response) {
        var self = this;
        var ArrayOfVideoId = [];
        var videoId;
        res = response.result.items;
        $.each(response.result.items, function(index, val) {
            if (val.snippet.hasOwnProperty('resourceId')) {
                videoId = val['snippet']['resourceId']['videoId'];
            }
            if (val.id.hasOwnProperty('videoId')) {
                videoId = val['id']['videoId'];
            }
            ArrayOfVideoId[index] = videoId;
        })
        var stringsOfVideoId = ArrayOfVideoId.join(",");
        console.log(stringsOfVideoId);
        self.getVideoDetails(stringsOfVideoId);
    },
    getVideoDetails: function(id) {
        var self = this;
        var request = gapi.client.youtube.videos.list({
            part: 'snippet,statistics,player',
            id: id,
            maxResults: 12
        });
        request.execute(self.handleVideoDetails);
    },
    getSubscribtion: function() {
        var request = gapi.client.youtube.activities.list({
            part: 'snippet',
            home: true,
            maxResults: 12
        });

        function dumy(response) {
            self.getVideoIds(response);
        }
        request.execute(dumy);
    },
    search: function() {
        var self = this;
        // Use the JavaScript client library to create a search.list() API call.
        var request = gapi.client.youtube.search.list({
            part: 'snippet',
            q: $('#searchText').val(),
            maxResults: 12,
            order: 'viewCount',
            safeSearch: 'moderate'
        });

        function getVideoId(response) {
            self.getVideoIds(response);
        }
        // Send the request to the API server,
        // and invoke onSearchRepsonse() with the response.
        request.execute(getVideoId);
    },
    onSearchResponse: function(response) {
        self.handleVideoDetails(response);
    },
    getPopularVideoDetails: function() {
        var self = this;

        function send(response) {
            self.handleVideoDetails(response);
        }
        var request = gapi.client.youtube.videos.list({
            part: 'snippet,statistics,player',
            chart: "mostPopular",
            regionCode: "IN",
            maxResults: 12
        });
        request.execute(send);
    },
    handleVideoDetails: function(response) {
        console.log(response);
        $('ul.searchedVideos').html('');
        var htmlContent = '';
        template = Handlebars.compile($('#Searchtemplate').html());
        $.each(response.result.items, function(index, val) {
            var context = {
                //snippet variables
                title: val['snippet']['title'],
                thumbnailUrl: val['snippet']['thumbnails']['medium']['url'],
                highResImg: val['snippet']['thumbnails']['high']['url'],
                watchOnYoutube: 'http://www.youtube.com/watch?v=' + val.id + '&feature=youtube_gdata_player',
                channelTitle: val['snippet']['channelTitle'],
                channelId: val['snippet']['channelId'],
                description: val['snippet']['description'],
                //publishedAt: new Date(val['snippet']['publishedAt']).toLocaleDateString(),
                publishedAt: val['snippet']['publishedAt'],
                //statistics variables
                commentCount: val.statistics.commentCount,
                dislikeCount: val.statistics.dislikeCount,
                likeCount: val.statistics.likeCount,
                viewCount: val.statistics.viewCount,
                //player iframe 
                player: val.player.embedHtml,
                videoId: val.id
            }
            console.log(context);
            var date = new Date(context.publishedAt);
            context.publishedAt = date.toDateString();
            var url = "http://www.youtube.com/embed/" + context.videoId + "?autoplay=1";
            context.url = url;
            htmlContent += template(context);
        });
        $('ul.searchedVideos').append(htmlContent);
    },
    nextPage: function() {
        requestVideoPlaylist(playlistId, nextPageToken);
    },
    // Retrieve the previous page of videos.
    previousPage: function() {
        requestVideoPlaylist(playlistId, prevPageToken);
    }
}

function Video() {
    this.init();
}
Video.prototype = {
    init: function() {
        var self = this;
        $(document.body).bind('showMetaData', function(event) { /* Act on the event */
            self.showMetaData();
        });
        $(document.body).bind('hideMetaData', function(event) { /* Act on the event */
            self.hideMetaData();
        });
    },
    showMetaData: function() {
        $('#extra_info').remove();
        var parentOfEvent = event.target.parentElement;
        var targetCard = $(parentOfEvent).parent()[0];
        var siblingCard = targetCard.nextElementSibling;
        var targetOffset = targetCard.offsetTop;
        var metaHtml = targetCard.childNodes[5].innerHTML;
        var container = $('<div id="extra_info" style="display:none;">')
        var down_arrow = parentOfEvent.childNodes[1];
        if (siblingCard) {
            var siblingOffset = siblingCard.offsetTop;
        } else {
            $('.meta_triangle').css('display', 'none');
            $(targetCard).after(container);
            $('#extra_info').html(metaHtml);
            $(down_arrow).css({
                'display': 'block'
            });
            container.slideDown(800);
            return;
        }
        var signPosition = targetOffset + 200;

        //$(#sign).css({top:signPosition})

        function rec(targetOffset, siblingOffset, siblingCard, targetCard) {
            if (targetOffset != siblingOffset) {
                $('.meta_triangle').css('display', 'none');
                $(targetCard).after(container);
                $('#extra_info').html(metaHtml);
                $(down_arrow).css({
                    'display': 'block'
                });
                container.slideDown(800);
                return;
            }
            var nextTargetCard = targetCard.nextElementSibling;
            var nextTargetOffset = nextTargetCard.offsetTop;
            var nextSibling = siblingCard.nextElementSibling;
            if (nextSibling) {
                var nextSiblingOffset = nextSibling.offsetTop;
            } else {
                $('.meta_triangle').css('display', 'none');
                $(nextTargetCard).after(container);
                $('#extra_info').html(metaHtml);
                $(down_arrow).css({
                    'display': 'block'
                });
                container.slideDown(800);
                return;
            }
            rec(nextTargetOffset, nextSiblingOffset, nextSibling, nextTargetCard)
        }
        rec(targetOffset, siblingOffset, siblingCard, targetCard)
    },
    hideMetaData: function() {
        $('#extra_info').slideUp(800);
        // $('#extra_info').remove();
    }
}

function YoutubeController() {
    this.init();
    this.oauthCallback();
}
YoutubeController.prototype = {
    oauthCallback: function() {
        $(document.body).trigger('startAuth');
    },
    init: function() {
        var apiRequestObj = new ApiRequest();
        var videoObj = new Video();
        $('#login_link').click(function(event) {
            $(document.body).trigger('checkLogin');
        });
        $('#liked').bind('click', function() {
            $(document.body).trigger('showLikedVideos');
            $(document.body).trigger('hideNav');
            $('#video_cateogry_wrapper span').html('Liked videos');
        })
        $('#myUploads').bind('click', function() {
            $(document.body).trigger('showUploadedVideos');
            $(document.body).trigger('hideNav');
            $('#video_cateogry_wrapper span').html('Uploaded videos');
        })
        $('#watchLater').bind('click', function() {
            $(document.body).trigger('showWatchLaterVideos');
            $(document.body).trigger('hideNav');
            $('#video_cateogry_wrapper span').html('Watch-later Videos');
        })
        $('#watchHistory').bind('click', function() {
            $(document.body).trigger('showWatchHistoryVideos');
            $(document.body).trigger('hideNav');
            $('#video_cateogry_wrapper span').html('Video history');
        })
        $('#popular').bind('click', function() {
            $(document.body).trigger('showPopularVideos');
            $(document.body).trigger('hideNav');
            $('#video_cateogry_wrapper span').html('Popular videos');
        })
        $('#feeds').bind('click', function() {
            $(document.body).trigger('showfeedsVideos');
            $(document.body).trigger('hideNav');
            $('#video_cateogry_wrapper span').html('subscribed videos');
        })
        $('#searchText').bind('keypress', function(event) {
            if (event.keyCode == 13) {
                $(document.body).trigger('showSearchedVideos');
            }
        })
        $('button#searchButton').bind('click', function() {
            $(document.body).trigger('showSearchedVideos');
        })
        $(document.body).delegate('.videothumb', 'click', function(event) {
            $('#video_player').html($(this).attr('data-tip-iframe'));
            $('#frameContainer').css({
                top: 0,
                left: 0
            });
        });
        $('button.delete').bind('click', function() {
            $('#banner').remove();
            $('#video_player').html("")
            $('#frameContainer').css({
                top: "-700px"
            });
        });
        $(document).delegate('.show_hidden_part', 'click', function(event) {
            $(document.body).trigger('showMetaData');
        });
        $(document).delegate('#removeMetaData', 'click', function(event) {
            $(document.body).trigger('hideMetaData');
            $('.meta_triangle').css({
                "display": "none"
            });
        });


        $('#apps').bind('click', function(event) {
            /* Act on the event */
            var display = $('#nav_container').css('display');
            if (display == "none") {
                $('#nav_container').css({
                    display: 'block'
                });
                return;
            } else {
                $('#nav_container').css({
                    display: 'none'
                });
            }


        });
        $('#mac_dock').toggle(function() {
            /* Stuff to do every *odd* time the element is clicked */
            $('#dock_container').css({
                display: 'block'
            });
        }, function() {
            /* Stuff to do every *even* time the element is clicked */
            $('#dock_container').css({
                display: 'none'
            });
        });
        $(document.body).bind('hideNav', function(event) {
            /* Act on the event */
            $('#nav_container').css({
                display: 'none'
            });
        });
        $(document.body).delegate('.video_card', 'mouseover', function(event) {
            var showButton = this.children[1].children[1];
            var viewsSpan = this.children[0].childNodes[3];
            $(showButton).css({
                display: 'block',
                top: '3px'
            });
            $(viewsSpan).css({
                display: 'inline-block',
                left: '0px'
            });
        });
        $(document.body).delegate('.video_card', 'mouseout', function(event) {
            var showButton = this.children[1].children[1];
            var viewsSpan = this.children[0].childNodes[3];
            $(showButton).css({
                display: 'none',
                top: '0px;'
            });
            $(viewsSpan).css({
                display: 'none',
                left: '-100px'
            });

        });
        $('#oneclick_menu').click(function(event) {
            /* Act on the event */
            $('#system_overlay').slideDown(800);
            // $('#system_overlay').css('display','block');
        });
        $('#remove_overlay').click(function(event) {
            /* Act on the event */
            //$('#system_overlay').css('display','none');
            $('#system_overlay').slideUp(800);
        });
        $('#video-container').bind("click", function() {
            var display = $('#nav_container').css('display');
            if (display == "block") {
                $('#nav_container').css({
                    display: 'none'
                });
            }
        });
        $('#video_cateogry_wrapper').bind('click', function(event) {
            /* Act on the event */
            var display = $('#nav_container').css('display');
            if (display == "block") {
                $('#nav_container').css({
                    display: 'none'
                });
            }
        });

    }
}
//tooltip specific
$(document).ready(function() {

    // Tooltip
    $(document.body).delegate('.tooltip', 'mouseover', function(event) {

        // data type - text
        if ($(this).attr('data-tip-type') == 'text') {
            $('#tooltip_container').html($(this).attr('data-tip-source'));
        }


        $('#tooltip_container').css({
            'display': 'block',
            'opacity': 0
        }).animate({
            opacity: 1
        }, 250);

    });

    $(document.body).delegate('.tooltip', 'mousemove', function(event) {

        var tooltipWidth = $('#tooltip_container').outerWidth();
        var tooltipHeight = $('#tooltip_container').outerHeight();

        // width detection
        var pageWidth = $('body').width();
        if (event.clientX > pageWidth / 2) {
            $('#tooltip_container').css('left', (event.clientX - tooltipWidth + 20) + 'px');
        } else {
            $('#tooltip_container').css('left', (event.clientX - 20) + 'px');
        }

        // height detection
        if (event.clientY > 100) {

            $('#tooltip_container').css('top', (event.clientY - (tooltipHeight + 20)) + 'px');
        } else {
            $('#tooltip_container').css('top', (event.clientY + 20) + 'px');
        }



    })
    $(document.body).delegate('.tooltip', 'mouseout', function(event) {
        $('#tooltip_container').animate({
            opacity: 0
        }, 250, function() {
            $('#tooltip_container').css('display', 'none')
        });
    });

});

//light box plugin
$(document).ready(function() {
    /*
     *  Simple image gallery. Uses default settings
     */

    $('.fancybox').fancybox();

    /*
     *  Different effects
     */

    // Change title type, overlay closing speed
    $(".fancybox-effects-a").fancybox({
        helpers: {
            title: {
                type: 'outside'
            },
            overlay: {
                speedOut: 0
            }
        }
    });

    $(".various").fancybox({
        maxWidth: 800,
        maxHeight: 600,
        fitToView: false,
        width: '70%',
        height: '70%',
        autoSize: false,
        closeClick: false,
        openEffect: 'none',
        closeEffect: 'none'
    });



    // Disable opening and closing animations, change title type
    $(".fancybox-effects-b").fancybox({
        openEffect: 'none',
        closeEffect: 'none',

        helpers: {
            title: {
                type: 'over'
            }
        }
    });

    // Set custom style, close if clicked, change title type and overlay color
    $(".fancybox-effects-c").fancybox({
        wrapCSS: 'fancybox-custom',
        closeClick: true,

        openEffect: 'none',

        helpers: {
            title: {
                type: 'inside'
            },
            overlay: {
                css: {
                    'background': 'rgba(238,238,238,0.85)'
                }
            }
        }
    });

    // Remove padding, set opening and closing animations, close if clicked and disable overlay
    $(".fancybox-effects-d").fancybox({
        padding: 0,

        openEffect: 'elastic',
        openSpeed: 150,

        closeEffect: 'elastic',
        closeSpeed: 150,

        closeClick: true,

        helpers: {
            overlay: null
        }
    });

    /*
     *  Button helper. Disable animations, hide close button, change title type and content
     */

    $('.fancybox-buttons').fancybox({
        openEffect: 'none',
        closeEffect: 'none',

        prevEffect: 'none',
        nextEffect: 'none',

        closeBtn: false,

        helpers: {
            title: {
                type: 'inside'
            },
            buttons: {}
        },

        afterLoad: function() {
            this.title = 'Image ' + (this.index + 1) + ' of ' + this.group.length + (this.title ? ' - ' + this.title : '');
        }
    });


    /*
     *  Thumbnail helper. Disable animations, hide close button, arrows and slide to next gallery item if clicked
     */

    $('.fancybox-thumbs').fancybox({
        prevEffect: 'none',
        nextEffect: 'none',

        closeBtn: false,
        arrows: false,
        nextClick: true,

        helpers: {
            thumbs: {
                width: 50,
                height: 50
            }
        }
    });

    /*
     *  Media helper. Group items, disable animations, hide arrows, enable media and button helpers.
     */
    $('.fancybox-media')
        .attr('rel', 'media-gallery')
        .fancybox({
            openEffect: 'none',
            closeEffect: 'none',
            prevEffect: 'none',
            nextEffect: 'none',

            arrows: false,
            helpers: {
                media: {},
                buttons: {}
            }
        });

    /*
     *  Open manually
     */

    $("#fancybox-manual-a").click(function() {
        $.fancybox.open('1_b.jpg');
    });

    $("#fancybox-manual-b").click(function() {
        $.fancybox.open({
            href: 'iframe.html',
            type: 'iframe',
            padding: 5
        });
    });

    $("#fancybox-manual-c").click(function() {
        $.fancybox.open([{
            href: '1_b.jpg',
            title: 'My title'
        }, {
            href: '2_b.jpg',
            title: '2nd title'
        }, {
            href: '3_b.jpg'
        }], {
            helpers: {
                thumbs: {
                    width: 75,
                    height: 50
                }
            }
        });
    });



});