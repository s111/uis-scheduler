var programs
var subjects
var lectureList = [];
var subjectList = [];

var today = new Date("3/23/2015");

$.getJSON("programs.json", function(p) {
    programs = _.sortBy(p, 'Name');

    _.each(programs, function(program, i) {
        var item = "<option>" + program.Name + "</option>";
        $("#program-list").append(item);
    });
});

$.getJSON("subjects.json", function(p) {
    subjects = _.sortBy(p, 'Name');

    _.each(subjects, function(subject, i) {
        var item = "<option>" + subject.Name + "</option>";
        $("#subject-list").append(item);
    });
});


$("#add-program").click(function() {
    if (programs) {
        var program = programs[$("#program-list option:selected").index()];

        _.each(program.Subjects, function(id, i) {
            if (!_.contains(subjectList, id)) {
                subjectList.push(id);

                $.getJSON("subjects/" + encodeURI(id) + ".json", function(subject) {
                    $("#subjects").append('<a href="#" class="label label-danger" onClick="removeSubject(this, \'' + btoa(id) + '\')">' + subject.Name.substr(0, 8) + ' <span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>\n');

                    _.each(subject.Lectures, function(lecture, j) {
                        lecture.Subject = id;

                        var d = new Date(lecture.Date);

                        if (d.toDateString() == today.toDateString()) {
                            lectureList.push(lecture);
                        }
                    });

                    updateLectureList();
                });
            }
        });
    }
});

$("#add-subject").click(function() {
    if (subjects) {
        var subject = subjects[$("#subject-list option:selected").index()];
        var id = subject.Id;

        if (!_.contains(subjectList, id)) {
            subjectList.push(id);

            $.getJSON("subjects/" + encodeURI(id) + ".json", function(subject) {
                $("#subjects").append('<a href="#" class="label label-danger" onClick="removeSubject(this, \'' + btoa(id) + '\')">' + subject.Name.substr(0, 8) + ' <span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>\n');

                _.each(subject.Lectures, function(lecture, j) {
                    lecture.Subject = id;

                    var d = new Date(lecture.Date);

                    if (d.toDateString() == today.toDateString()) {
                        lectureList.push(lecture);
                    }
                });

                updateLectureList();
            });
        }
    }
});


function removeSubject(label, subject) {
    $(label).remove();

    subject = atob(subject);

    subjectList = _.without(subjectList, subject);

    lectureList = _.reject(lectureList, function(lecture) {
        return lecture.Subject === subject;
    });

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