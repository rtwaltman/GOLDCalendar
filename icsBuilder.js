// Modified version of Open Source Github Project found here:
// https://github.com/nwcell/ics.js

/* global saveAs, Blob, BlobBuilder, console */
/* exported ics */

var ics = function() {
    'use strict';

    // Conditionally set the separator based on OS. Windows needs a carraige
    // return '\r'
    var SEPARATOR = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';
    var calendarEvents = [];
    var calendarStart = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0'
    ].join(SEPARATOR);
    var calendarEnd = SEPARATOR + 'END:VCALENDAR';

    return {
        /**
         * Returns events array
         * @return {array} Events
         */
        'events': function() {
            return calendarEvents;
        },

        /**
         * Returns calendar
         * @return {string} Calendar in iCalendar format
         */
        'calendar': function() {
            return calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;
        },

        /**
         * Add event to the calendar
         * @param  {string} subject     Subject/Title of event
         * @param  {string} description Description of event
         * @param  {string} location    Location of event
         * @param  {string} begin       Beginning date of event
         * @param  {string} stop        Ending date of event
         * @param  {Object} repeat      Object containing days, repeat freq, and end of repeat
         *      - Object properties: {string} stop, {string} freq, {array} days
         */
        'addEvent': function(subject, description, location, begin, stop, repeat) {
            // I'm not in the mood to make these optional... So they are all required
            // Added: if repeat obj exists, it must have the three required
            // properties
            if (typeof subject === 'undefined' ||
                typeof description === 'undefined' ||
                typeof location === 'undefined' ||
                typeof begin === 'undefined' ||
                typeof stop === 'undefined' )
            {
                return false;
            }
            // If repeat exists and does not have all properties, exit
            if (typeof repeat !== 'undefined') {
              if (!repeat.hasOwnProperty('freq')  ||
                  !repeat.hasOwnProperty('days')    ||
                  !repeat.hasOwnProperty('stop'))
              {
                return false;
              }
            }
            // Exit out if the begin and stop are the same and if repeat is empty
            if (begin === stop || typeof repeat !== 'undefined' &&
            (repeat.length === 1 && repeat[0] === '')){
              return false;
            }

            // Assign repeat to be used if it exists and passed the above tests
            var doRepeat = !(typeof repeat === 'undefined');

            var calendarEventArr = [
                'BEGIN:VEVENT',
                'SUMMARY;LANGUAGE=en-us:' + subject,
                'DESCRIPTION:' + description,
                'LOCATION:' + location,
                'DTSTART;TZID=America/Los_Angeles:' + dateBuilder(begin),
                'DTEND;TZID=America/Los_Angeles:' + dateBuilder(stop),
                'CLASS:PRIVATE',
                'TRANSP:OPAQUE',
                'END:VEVENT'
            ];

            // Add in repeat rule if needed
            //TODO: Add in weekend repeat functionality
            if (doRepeat) {
              // Change day string to comply with iCal format
              repeat.days.forEach(function (elem, index, arr){
                switch(elem.toUpperCase()){
                  case 'M':
                    arr[index] = 'MO';
                    break;
                  case 'T':
                    arr[index] = 'TU';
                    break;
                  case 'W':
                    arr[index] = 'WE';
                    break;
                  case 'R':
                    arr[index] = 'TH';
                    break;
                  case 'F':
                    arr[index] = 'FR';
                    break;
                  default:
                    console.error("Error building repeat event!!");
                    break;
                }
              });

              calendarEventArr.splice(6, 0,
                'RRULE:FREQ=' + repeat.freq.toUpperCase() +
                ';UNTIL=' + dateBuilder(repeat.stop) +
                ';BYDAY=' + repeat.days.join(','));
            }

            var calendarEvent = calendarEventArr.join(SEPARATOR);

            calendarEvents.push(calendarEvent);
            return calendarEvent;
        },

        /**
         * Download calendar using the saveAs function from filesave.js
         * @param  {string} filename Filename
         * @param  {string} ext      Extention
         */
        'download': function(filename, ext) {
            if (calendarEvents.length < 1) {
                return false;
            }

            ext = (typeof ext !== 'undefined') ? ext : '.ics';
            filename = (typeof filename !== 'undefined') ? filename : 'calendar';
            var calendar = calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;

            var blob;
            if (navigator.userAgent.indexOf('MSIE 10') === -1) { // chrome or firefox
                blob = new Blob([calendar]);
            } else { // ie
                var bb = new BlobBuilder();
                bb.append(calendar);
                blob = bb.getBlob('text/x-vCalendar;charset=' + document.characterSet);
            }
            saveAs(blob, filename + ext);
            return calendar;
        }
    };
};

/**
 * Creates and returns date string for iCalendar format
 * @param  {string} pDate     Subject/Title of event
 *
 * @return {string} Date String in YYYYMMDDTHHMMSS
 */
function dateBuilder(pDate){
  var date = new Date(pDate);

  var year = ("0000" + (date.getFullYear().toString())).slice(-4);
  var month = ("00" + ((date.getMonth() + 1).toString())).slice(-2);
  var day = ("00" + ((date.getDate()).toString())).slice(-2);
  var hours = ("00" + (date.getHours().toString())).slice(-2);
  var minutes = ("00" + (date.getMinutes().toString())).slice(-2);
  var seconds = ("00" + (date.getSeconds().toString())).slice(-2);

  return year + month + day + 'T' + hours + minutes + seconds;
};
