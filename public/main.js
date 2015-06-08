var ids = [];

var today = new Date("3/23/2015");

var CourseSchedule = React.createClass({displayName: "CourseSchedule",
    handleClick: function(id) {
        var subjects = this.state.subjects.slice();

        subjects.forEach(function(subject, i) {
            if (subject.Id === id) {
                subjects.splice(i, 1);

                return;
            }
        });

        var lectures = this.state.lectures.slice();

        for (var i = lectures.length - 1; i >= 0; i--) {
            if (lectures[i].Id === id) {
                lectures.splice(i, 1);
            }
        };

        this.setState({subjects: subjects, lectures: lectures});

        var index = ids.indexOf(id);
        ids.splice(index, 1);

        localStorage.setItem("subjects", JSON.stringify(ids));
    },

    addSubjects: function(subjects) {
        subjects.forEach(function(subject) {
            this.addSubject(subject);
        }.bind(this));
    },

    addSubject: function(subject) {
        if (subject.Id) {
            subject = subject.Id;
        }

        if ($.inArray(subject, ids) != -1) {
            return;
        }

        ids.push(subject);

        localStorage.setItem("subjects", JSON.stringify(ids));

        var url = "/lectures/" + encodeURI(subject) + ".json";

        $.ajax({
            url: url,
            dataType: "json",
            cache: false,
            success: function(data) {
                var subjects = this.state.subjects.slice();
                subjects.push({Name: data.Name, Id: subject});

                subjects.sort(function(a, b) {
                    return a.Name > b.Name;
                });

                var lectures = this.state.lectures.slice();

                data.Lectures.forEach(function(lecture) {
                    var start = new Date(lecture.Date);

                    if (start.toDateString() == today.toDateString()) {
                        lecture.Id = subject;
                        lectures.push(lecture);
                    }
                });

                lectures.sort(function(a, b) {
                    return a.Date > b.Date;
                });

                this.setState({subjects: subjects, lectures: lectures});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function() {
        return {
            subjects: [],
            lectures: []
        };
    },

    componentDidMount: function() {
        var subjects = localStorage.getItem("subjects");

        if (subjects !== null) {
            this.addSubjects(JSON.parse(subjects));
        }
    },

    render: function() {
        return (
            React.createElement("div", {className: "container"}, 
                React.createElement(Controls, {subjects: this.state.subjects, onSubmit: this.addSubject, onClick: this.handleClick}), 
                React.createElement(LectureList, {data: this.state.lectures})
            )
        );
    }
});

var Controls = React.createClass({displayName: "Controls",
    addProgram: function(program) {
        program.Subjects.forEach(function(subject) {
            this.props.onSubmit(subject);
        }.bind(this));
    },

    render: function() {
        return(
            React.createElement("div", {className: "well"}, 
                React.createElement(Selection, {type: "programs", data: this.props.programs, onSubmit: this.addProgram}), 
                React.createElement(Selection, {type: "subjects", data: this.props.subjects, onSubmit: this.props.onSubmit}), 
                React.createElement(SelectedSubjects, {data: this.props.subjects, onClick: this.props.onClick})
            )
        );
    }
});

var Selection = React.createClass({displayName: "Selection",
    handleSubmit: function(e) {
        e.preventDefault();

        if (this.state.list.length > 1) {
            this.props.onSubmit(this.state.list[this.refs.selection.getDOMNode().selectedIndex]);
        }
    },

    getInitialState: function() {
        return {
          list: [{Name: "Loading " + this.props.type + "..."}]
        };
    },

    componentDidMount: function() {
        $.ajax({
            url: "/"+this.props.type+".json",
            dataType: "json",
            cache: false,
            success: function(data) {
                this.setState({list: data});
            }.bind(this),
            error: function(xhr, status, err) {
                this.setState({list: [{Name: "Error loading " + this.props.type + "..."}]});
            }.bind(this)
        });
    },

    render: function() {
        var options = this.state.list.map(function(option, i) {
            return (
                React.createElement("option", {key: i}, option.Name)
            );
        });

        var id = this.props.type.substring(0, this.props.type.length - 1) + "-list";
        var label = this.props.type.charAt(0).toUpperCase() + this.props.type.substring(1) + ":";

        return (
            React.createElement("form", {onSubmit: this.handleSubmit}, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-lg-12"}, 
                        React.createElement("label", {htmlFor: id}, label), 

                        React.createElement("div", {className: "input-group"}, 
                            React.createElement("select", {id: id, className: "form-control", ref: "selection"}, 
                                options
                            ), 

                            React.createElement("span", {className: "input-group-btn"}, 
                                React.createElement("button", {className: "btn btn-primary", type: "submit"}, "Add")
                            )
                        )
                    )
                )
            )
        );
    }
});

var SelectedSubjects = React.createClass({displayName: "SelectedSubjects",
    render: function() {
        var selected = this.props.data.map(function(subject, i) {
            return (
                React.createElement(Subject, {subject: subject, key: i, onClick: this.props.onClick})
            );
        }.bind(this));

        return (
            React.createElement("div", {className: "selected-subjects"}, 
                selected
            )
        );
    }
});

var Subject = React.createClass({displayName: "Subject",
    render: function() {
        return (
            React.createElement("button", {className: "btn btn-danger btn-mini", onClick: this.props.onClick.bind(null, this.props.subject.Id)}, 
                this.props.subject.Name.substring(0, 8), " ", React.createElement("span", {className: "glyphicon glyphicon-remove", "aria-hidden": "true"})
            )
        );
    }
});

var LectureList = React.createClass({displayName: "LectureList",
    render: function() {
        var lectures = this.props.data.map(function(lecture, i) {
            return (
                React.createElement(Lecture, {data: lecture, key: i})
            );
        });

        return (
            React.createElement("div", {className: "list-group"}, 
                lectures
            )
        );
    }
});

var Lecture = React.createClass({displayName: "Lecture",
    render: function() {
        var start = new Date(this.props.data.Date);
        var end = new Date(start.valueOf());
        end.setHours(end.getHours() + this.props.data.Length);

        var lectureStart = start.toTimeString().substring(0, 5);
        var lectureEnd = end.toTimeString().substring(0, 5);

        return (
            React.createElement("a", {href: "#", className: "list-group-item"}, 
                React.createElement("h6", {className: "list-group-item-heading"}, this.props.data.Name), 
                React.createElement("p", {className: "list-group-item-text"}, 
                    React.createElement("span", {className: "label label-info"}, lectureStart, " - ", lectureEnd)
                )
            )
        );
    }
});

React.render(
    React.createElement(CourseSchedule, null),
    document.body
);