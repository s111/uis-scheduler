var programs
var lectureList = [];
var numSubjects = 0;

var today = new Date("3/23/2015");

$.getJSON("programs.json", function(p) {
    programs = _.sortBy(p, 'Name');

    _.each(programs, function(program, i) {
        var item = "<option>" + program.Name + "</option>";
        $("#course-list").append(item);
    });
});

$("#add-program").click(function() {
    if (programs) {
        var program = programs[$("#course-list option:selected").index()];

        _.each(program.Subjects, function(id, i) {
            $.getJSON("subjects/" + encodeURI(id) + ".json", function(subject) {
                $("#subjects").append('<a href="#" class="label label-danger" onClick="removeSubject(this, ' + numSubjects + ')">' + subject.Name.substr(0, 8) + ' <span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>\n');

                _.each(subject.Lectures, function(lecture, j) {
                    lecture.Subject = numSubjects;
                    var d = new Date(lecture.Date);

                    if (d.toDateString() == today.toDateString()) {
                        lectureList.push(lecture);
                    }
                });

                numSubjects++;

                updateLectureList();
            });
        });
    }
});

function removeSubject(label, subject) {
    $(label).remove();

    for (var i = lectureList.length - 1; i >= 0; i--) {
        if (lectureList[i].Subject == subject) {
            lectureList.splice(i, 1);
        }
    }

    updateLectureList();
}

function updateLectureList() {
    var lectures = _.sortBy(lectureList, 'Date');

    $("#lectures").empty();

    _.each(lectures, function(lecture, i) {
        var d = new Date(lecture.Date);
        var end = new Date(d.valueOf());
        end.setHours(end.getHours() + lecture.Length);

        var item = '<a href="#" class="list-group-item"><h6 class="list-group-item-heading">' + lecture.Name + '</h6><p class="list-group-item-text"><span class="label label-info">' + d.toTimeString().substr(0, 5) + ' - ' + end.toTimeString().substr(0, 5) + '</span></p></a>';
        $("#lectures").append(item);
    });
}