// Array move function that moves an element from
// one element to the (after initial cut) desired location
Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

// Course Object Constructor
var Course = function Course(courseInfoArr, qtr) {
	// Assign the quarter selected in the dropdown
	this.qtr = QUARTER;
	this.discussion = false; //assume no discussion until we know there is one
	this.shorterCourse = false; //assume regular length course

	// Remove extranneous text after the Course Title
	var courseAndTitle = courseInfoArr[0].split('course')[0];

	// Determine if the course runs shorter than the full quarter
	var dateRegExp = /\d{1,2}\/\d{1,2}\ - \d{1,2}\/\d{1,2}/;
	if (dateRegExp.test(courseAndTitle)) {
		var regExpArr = /\d{1,2}\/\d{1,2}\ - \d{1,2}\/\d{1,2}/.exec(courseAndTitle);
		this.shorterCourse = true;

		this.startDate = regExpArr[0].split(' - ')[0] + '/' + QUARTER.split('20')[1];
		this.endDate = regExpArr[0].split(' - ')[1] + '/' + QUARTER.split('20')[1];

		// Cut the extra 'Session ### (MM/DD - MM/DD)' text
		courseAndTitle = courseAndTitle.split('Session')[0];
	}

	// There is a discussion in addition to the lecture
	// length 11: Same instructor for lecture and discussion
	// length 12: Different instructors for lecture and discussion
	// length 13: One instructor for lecture, Multiple instructors for discussion
	if(courseInfoArr.length >= 11) {
		this.discussion = true;

		switch(courseInfoArr.length) {
			case 11:
				this.discInstructor = courseInfoArr[4];
				this.discDays = courseInfoArr[8].split(' ');
				this.discStartTime = courseInfoArr[9].split('-')[0];
				this.discEndTime = courseInfoArr[9].split('-')[1];
				this.discLocation = courseInfoArr[10];
				break;
			case 12:
				courseInfoArr.move(5, 8); //Move TA into sequential elem for ease
				this.discInstructor = courseInfoArr[8];
				this.discDays = courseInfoArr[9].split(' ');
				this.discStartTime = courseInfoArr[10].split('-')[0];
				this.discEndTime = courseInfoArr[10].split('-')[1];
				this.discLocation = courseInfoArr[11];
				break;
			case 13:
				courseInfoArr.move(5, 9); //Move TAs into sequential elem for ease
				courseInfoArr.move(5, 9); //Move TAs into sequential elem for ease
				this.discInstructor = courseInfoArr[8] + ', ' + courseInfoArr[9];
				this.discDays = courseInfoArr[10].split(' ');
				this.discStartTime = courseInfoArr[11].split('-')[0];
				this.discEndTime = courseInfoArr[11].split('-')[1];
				this.discLocation = courseInfoArr[12];
				break;
			default:
				console.error("courseInfoArr.length >= 11 but not = 11, 12, 13!");
		}
	}

	// There is a lecture at the very least
	if(courseInfoArr.length >= 8) {
		this.course = courseAndTitle.split(' - ')[0].trim();
		this.title = courseAndTitle.split(' - ')[1].trim();
    this.id = [this.course, this.title].join(' - ');
		this.enrollCode = courseInfoArr[1];
		this.grading = courseInfoArr[2];
		this.units = courseInfoArr[3];
		this.instructor = courseInfoArr[4];
		this.days = courseInfoArr[5].split(' ');
		this.startTime = courseInfoArr[6].split('-')[0];
		this.endTime = courseInfoArr[6].split('-')[1];
		this.location = courseInfoArr[7];
	}
};
