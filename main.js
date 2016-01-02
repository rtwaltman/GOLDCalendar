// Date addDays allows us to safely add days without having to manually
// calculate month rollover
Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};

// Start Dates and Days are hardcoded for now from:
// https://registrar.sa.ucsb.edu/cal2016.aspx
// Automating this would likely require web crawling
var dateMap15_16 = {
  "fall": {startDate: new Date('9/24/15'), startDay: 'TH', endDate: '12/4/15'},
  "winter": {startDate: new Date('1/4/16'), startDay: 'MO', endDate: '3/11/16'},
  "spring": {startDate: new Date('3/28/16'), startDay: 'MO', endDate: '6/3/16'}
};
var days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
var daysAlt = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
// Global quarter variable to determine start dates/day and end date for each
// class
var QUARTER;

function main() {
  var btnHTML =
    '<button id="GOLDCalBtn" type="button" class="btn-class">\
    Export Schedule\
    </button>\
    <br><br><br>';
  var schedHeader = document.getElementsByTagName("H3")[0];

  // Insert the button into the DOM
  schedHeader.insertAdjacentHTML(
    'afterend',
    btnHTML
  );
  // Find the newly inserted button and attach click event
  var btn = document.getElementById("GOLDCalBtn");
  btn.addEventListener('click', exportSchedule);

  // Remove the bottom margin from the header for better formatting
  schedHeader.style.marginBottom=0;

  function exportSchedule() {
    buildScheduleICS(buildScheduleJSON());
  };
};

function buildScheduleJSON() {
  // Find the quarter selected via the dropdown
  var qtrDropdown = document.getElementById("pageContent_quarterDropDown");
  QUARTER = qtrDropdown[qtrDropdown.selectedIndex].innerText;

  // Find the table of classses
  var classTable = document.getElementById('pageContent_CourseList');
  var numClasses = classTable.rows.length - 1; //subtract 1 for the header of the table

  // Arrays to hold completed course objects and course string info
  var Courses = [], courseInfoArr = [];

  var i, row, courseInfoElems, header, htmlCollection, tdClassName, course = {};
  for (i = 1; i <= numClasses; i++) // begin at 1 to skip the header of the table
  {
  	row = classTable.rows[i];

  	// Assign the class name we search with depending on whether row is odd or even
  	tdClassName = (i % 2) ? 'clcellprimary' : 'clcellprimaryalt';
  	// Get the htmlCollection and turn it into an array (to use array functions more easily)
  	courseInfoElems = Array.prototype.slice.call(row.getElementsByClassName(tdClassName));
  	// Omit any elements returned that aren't <td> (table data)
  	courseInfoElems = courseInfoElems.filter(function(elem){
  		return elem.nodeName === 'TD';
  	});
    // Build an array from the text of each HTML <td> elem, trimming extranneous
    // whitespace
    courseInfoArr = courseInfoElems.map(function(elem) {
      return elem.innerText.trim().replace(/\s+/g, " ");
    });

    // Build Course Object
  	course = new Course(courseInfoArr);
    Courses.push(course);
  }

  // Get the Final Table out of the HTML and find the exam <td> elements
  var finalsTable = document.getElementById('pageContent_FinalsGrid')
  // Only proceed if Final Table was available
  if(finalsTable){
    var finalExams = Array.prototype.slice.call(
      finalsTable.getElementsByClassName('clcellprimary')
    );

    // Search final exam dates and add to Course Object
    var regExpValidDate = /^[A-Z]{1}[a-z]+, [A-Z]{1}[a-z]+ \d{1,2}, \d{4} \d{1,2}:\d{2} [A|P][M] - \d{1,2}:\d{2} [A|P][M]/;
    // Base Date means: 'Sunday, January 6, 2016' part of the string
    var regExpBaseDate = /^[A-Z]{1}[a-z]+, [A-Z]{1}[a-z]+ \d{1,2}, \d{4}/;
    // Globally matches the times, i.e. 8:00 AM
    var regExpTimes = /\d{1,2}:\d{2} [A|P][M]/g
    // Go through the finalExams Collection in pairs to check if the date of each
    // row is valid. If so, add the finalExamDate to the appropriate Course obj
    var courseString, dateString, baseDate, timesArr, matchedObj;
    for(i = 0; i < finalExams.length; i += 2){
      courseString = finalExams[i].innerText;
      dateString = finalExams[i+1].innerText;

      if(regExpValidDate.test(dateString)){
        baseDate = regExpBaseDate.exec(dateString)[0];
        timeArr = dateString.match(regExpTimes);

        // Find the object in the Courses Array with the matching title string
        // Ex: 'MCDB 220A - CHROMOSOMES'
        // When found, assign a new property, finalExamDate
        matchedObj = Courses.find(function (courseObj) {
          return courseObj.id === courseString;
        });
        matchedObj.finalExamStart = baseDate + ' ' + timeArr[0];
        matchedObj.finalExamEnd = baseDate + ' ' + timeArr[1];
      }
    }
  }
  return Courses;
};

function buildScheduleICS(coursesArr) {
  // Create the ics calendar object to build
  var cal = ics();
  var firstLecture = '', firstDiscussion = '';

  coursesArr.forEach(function(courseObj, index, arr) {
    // Calculate when the first available date for lecture is
    firstLecture =
      formatDateRegular(calcStartDate(courseObj.days, courseObj)) + ' ';

    // First, add the lecture event
    cal.addEvent(
      courseObj.course,     //subject parameter
      [                     //description parameter
        'Title: ' + courseObj.title,
        'Instructor: ' + courseObj.instructor,
        'Units: ' + courseObj.units
      ].join('\\n'),
      courseObj.location,   //location parameter
      firstLecture + courseObj.startTime,  //begin parameter
      firstLecture + courseObj.endTime,    //stop parameter
      {                     //repeat parameter
        freq: 'WEEKLY',
        stop: calcEndRepeatDate(courseObj) + ' 11:59 pm',
        days: courseObj.days
      }
    );

    // Then, add discussion event if it exists
    if(courseObj.discussion)
    {
      // Calculate when the first available date for discussion is
      firstDiscussion =
        formatDateRegular(calcStartDate(courseObj.discDays, courseObj)) + ' ';

      cal.addEvent(
        courseObj.course + ' Discussion',     //subject parameter
        [                     //description parameter
          'Title: ' + courseObj.title,
          'Instructor: ' + courseObj.discInstructor,
        ].join('\\n'),
        courseObj.discLocation,   //location parameter
        firstDiscussion + courseObj.discStartTime,  //begin parameter
        firstDiscussion + courseObj.discEndTime,    //stop parameter
        {                     //repeat parameter
          freq: 'WEEKLY',
          stop: calcEndRepeatDate(courseObj) + ' 11:59 pm',
          days: courseObj.discDays
        }
      );
    }

    // If a valid final exam was found for the course, add the event for it
    if (courseObj.hasOwnProperty('finalExamStart')) {
      cal.addEvent(
        courseObj.course + ' Final',     //subject parameter
        [                     //description parameter
          'Title: ' + courseObj.title,
          'Instructor: ' + courseObj.instructor,
        ].join('\\n'),
        courseObj.location,   //location parameter
        courseObj.finalExamStart,  //begin parameter
        courseObj.finalExamEnd    //stop parameter
      );
    }
  });

  cal.download(QUARTER.replace(/ /g,''));

  // Helper functions for building the .ics
  function calcEndRepeatDate(courseObj) {
    // If course is shorter than the quarter, end date is course's end date
    // Otherwise, the end date is the quater's end date
    return courseObj.shorterCourse ?
      courseObj.endDate :
      dateMap15_16[QUARTER.split(' ')[0].toLowerCase()].endDate;
  };
  function getstartDate() {
    return dateMap15_16[QUARTER.split(' ')[0].toLowerCase()].startDate;
  };
  function calcStartDate(dayArr, courseObj) {
    var startDate;

    // Begin by finding out if course is shorter than the regular quarter
    if (courseObj.shorterCourse){
      startDate = courseObj.startDate;
    }
    // Otherwise, we use the quarter start date
    else {
      startDate = dateMap15_16[QUARTER.split(' ')[0].toLowerCase()].startDate;
    }

    //
    var classStartDatesArr = [];
    dayArr.forEach(function(elem, index, arr) {
      classStartDatesArr.push(nextDay(daysAlt.indexOf(elem), startDate));
    });
    return new Date(Math.min.apply(null,classStartDatesArr));
  };
  // Returns a string in MM/DD/YY format
  function formatDateRegular(pDate)
  {
    var date = new Date(pDate);
     return [
       ("00" + ((date.getMonth() + 1).toString())).slice(-2),
       ("00" + ((date.getDate()).toString())).slice(-2),
       ("00" + (date.getFullYear().toString())).slice(-2)
     ].join('/');
  };
};
//Get a new date by passing in current Date and day of week desired
// 0 = Sunday -> 6 = Saturday
function nextDay(dow, pDate){
    var date = new Date(pDate);
    date.setDate(date.getDate() + (dow+(7-date.getDay())) % 7);
    return date;
};

// You can use this for easy debugging
var makelogs = function(obj) {
	console.log('Events Array');
	console.log('=================');
	console.log(obj.events());
	console.log('Calendar With Header');
	console.log('=================');
	console.log(obj.calendar());
};

main();
