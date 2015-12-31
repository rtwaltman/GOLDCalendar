// Array move function that moves an element from
// one element to the (after initial cut) desired location
Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};
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
  "fall": {startDate: new Date('9/24/15'), startDay: 'TH', endDate: '12/5/15'},
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
    console.log("Exporting Schedule");
    //buildSchedule();
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

    console.log(courseInfoArr);
    // Build Course Object
  	course = new Course(courseInfoArr);
    Courses.push(course);

  	console.log(course);
  }
  return Courses;
};

function buildScheduleICS(coursesArr) {
  // Crete the ics calendar object to build
  var cal = ics();
  var firstLecture = '', firstDiscussion = '';

  coursesArr.forEach(function(courseObj, index, arr) {
    // Calculate when the date of the first lecture is
    firstLecture = formatDateRegular(calcStartDate(courseObj.days)) + ' ';

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
        stop: getQtrEndRepeatDate(),
        days: courseObj.days
      }
    );

    // Then, add discussion event if it exists
    if(courseObj.discussion)
    {
      // Calculate when the date of the first discussion is
      firstDiscussion = formatDateRegular(calcStartDate(courseObj.discDays)) + ' ';

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
          stop: getQtrEndRepeatDate(),
          days: courseObj.discDays
        }
      );
    }
  });

  makelogs(cal);
  cal.download('test');

  // Helper functions for building the .ics
  function getQtrEndRepeatDate() {
    return dateMap15_16[QUARTER.split(' ')[0].toLowerCase()].endDate;
  };
  function getQtrStartDate() {
    return dateMap15_16[QUARTER.split(' ')[0].toLowerCase()].startDate;
  };
  function calcStartDate(dayArr) {
    var firstDayOfQtr = dateMap15_16[QUARTER.split(' ')[0].toLowerCase()].startDay;
    var qtrStartDate = dateMap15_16[QUARTER.split(' ')[0].toLowerCase()].startDate;

    // Find the difference between when the qtr starts and when the class day is
    var difference = daysAlt.indexOf(dayArr[0]) - days.indexOf(firstDayOfQtr);
    // If difference is == 0, the start of qtr coincides with first lecture, we
    // can simply return the start of qtr date
    if(difference === 0){
      return qtrStartDate;
    }
    // If difference is > 0, the start of qtr is before first lecture and we
    // can attend later in the week. We must adjust the date accordingly.
    else if (difference > 0) {
      return formatDateRegular(new Date(qtrStartDate).addDays(difference));
    }
    // If difference is < 0, check if 2nd day of class available. If there is
    // no 2nd day of class, we must wait until next week.
    else {
      //TODO: Compare all available start dates and find the min
      var classStartDatesArr = [];
      dayArr.forEach(function(elem, index, arr) {
        classStartDatesArr.push(nextDay(daysAlt.indexOf(elem), qtrStartDate));
      });
      return new Date(Math.min.apply(null,classStartDatesArr));

      // if (dayArr.length > 1){ //check next day recursively
      //   return calcStartDate(dayArr.slice(1));
      // } //base case where length = 1 and difference is
      // else {
      //   return nextDay(days.indexOf[])
      // }
    }

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
function nextDay(dow, pDate){
    var date = new Date(pDate);
    date.setDate(date.getDate() + (dow+(7-date.getDay())) % 7);
    return date;
}

// You can use this for easy debugging
var makelogs = function(obj) {
	console.log('Events Array');
	console.log('=================');
	console.log(obj.events());
	console.log('Calendar With Header');
	console.log('=================');
	console.log(obj.calendar());
}

main();
