// Course Object Constructor
var Course = function Course(courseInfoArr, qtr) {
	// Assign the quarter selected in the dropdown
	this.qtr = QUARTER;

	// If there is a discussion section, reorder TA element in array
	// for easier object building
	if(courseInfoArr.length === 12) {
		courseInfoArr.move(5, 8);
	}

	// There is a lecture but no discussion
	if(courseInfoArr.length >= 8) {
		// Remove extranneous text after the Course Title
		var courseAndTitle = courseInfoArr[0].split('course')[0];

		this.course = courseAndTitle.split('-')[0].trim();
		this.title = courseAndTitle.split('-')[1].trim();
		this.enrollCode = courseInfoArr[1];
		this.grading = courseInfoArr[2];
		this.units = courseInfoArr[3];
		this.instructor = courseInfoArr[4];
		this.days = courseInfoArr[5].split(' ');
		this.startTime = courseInfoArr[6].split('-')[0];
		this.endTime = courseInfoArr[6].split('-')[1];
		this.location = courseInfoArr[7];
		this.discussion = false; //assume no discussion until we know there is one
	}

	// There is a discussion in addition to the lecture
	if(courseInfoArr.length === 12) {
		this.discussion = true;
		this.discInstructor = courseInfoArr[8];
		this.discDays = courseInfoArr[9].split(' ');
		this.discStartTime = courseInfoArr[10].split('-')[0];
    this.discEndTime = courseInfoArr[10].split('-')[1];
		this.discLocation = courseInfoArr[11];
	}
};
