$.getJSON("programs.json", function(programs) {
    var sorted = _.sortBy(programs, 'Name');

    _.each(sorted, function(program, i) {
        var item = "<option>" + program.Name + "</option>";
        $("#course-list").append(item);
    });

    var today = new Date("3/23/2015");

    $.getJSON("subjects/" + encodeURI("STA100%2D1") + ".json", function(subject) {
        lectures = _.sortBy(subject.Lectures, 'Date');

        _.each(lectures, function(lecture, i) {
            var d = new Date(lecture.Date);
            if (d.toDateString() == today.toDateString()) {
                var end = new Date(d.valueOf());
                end.setHours(end.getHours()+lecture.Length);

                var item = '<a href="#" class="list-group-item"><h6 class="list-group-item-heading">'+lecture.Name+'</h6><p class="list-group-item-text"><span class="label label-info">'+d.toTimeString().substr(0, 5)+' - '+end.toTimeString().substr(0,5)+'</span></p></a>';

                $("#subjects").append(item);
            }
        });
    });
});
