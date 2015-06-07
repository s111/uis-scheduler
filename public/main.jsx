var ids = [];

var today = new Date("3/23/2015");

var CourseSchedule = React.createClass({ 
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
    },

    addSubject: function(subject) {
        if (subject.Id) {
            subject = subject.Id;
        }

        if ($.inArray(subject, ids) != -1) {
            return;
        }

        ids.push(subject);

        var url = "/lectures/" + encodeURI(subject) + ".json";

        $.ajax({
            url: url,
            dataType: "json",
            cache: false,
            success: function(data) {
                var subjects = this.state.subjects.slice();
                subjects.push({Name: data.Name, Id: subject});

                var lectures = this.state.lectures.slice();

                data.Lectures.forEach(function(lecture) {
                    var start = new Date(lecture.Date);

                    if (start.toDateString() == today.toDateString()) {
                        lecture.Id = subject;
                        lectures.push(lecture);
                    }
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

    render: function() {
        return (
            <div className="container">
                <Controls subjects={this.state.subjects} onSubmit={this.addSubject} onClick={this.handleClick} />
                <LectureList data={this.state.lectures} />
            </div>
        );
    }
});

var Controls = React.createClass({
    addSubjects: function(program) {
        program.Subjects.map(function(subject) {
            this.props.onSubmit(subject);
        }.bind(this));
    },

    render: function() {
        return(
            <div className="well">
                <Selection type="programs" data={this.props.programs} onSubmit={this.addSubjects} />
                <Selection type="subjects" data={this.props.subjects} onSubmit={this.props.onSubmit} />
                <SelectedSubjects data={this.props.subjects} onClick={this.props.onClick} />
            </div>
        );
    }
});

var Selection = React.createClass({
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
                <option key={i}>{option.Name}</option>
            );
        });

        var id = this.props.type.substring(0, this.props.type.length - 1) + "-list";
        var label = this.props.type.charAt(0).toUpperCase() + this.props.type.substring(1) + ":";

        return (
            <form onSubmit={this.handleSubmit}>
                <div className="row">
                    <div className="col-lg-12">
                        <label htmlFor={id}>{label}</label>

                        <div className="input-group">
                            <select id={id} className="form-control" ref="selection">
                                {options}
                            </select>

                            <span className="input-group-btn">
                                <button className="btn btn-primary" type="submit">Add</button>
                            </span>
                        </div>
                    </div>
                </div>
            </form>
        );
    }
});

var SelectedSubjects = React.createClass({
    render: function() {
        var selected = this.props.data.map(function(subject, i) {
            return (
                <Subject subject={subject} key={i} onClick={this.props.onClick} />
            );
        }.bind(this));

        return (
            <div className="selected-subjects">
                {selected}
            </div>
        );
    }
});

var Subject = React.createClass({
    render: function() {
        return (
            <button className="btn btn-danger btn-mini" onClick={this.props.onClick.bind(null, this.props.subject.Id)}>
                {this.props.subject.Name.substring(0, 8)} <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
            </button>
        );
    }
});

var LectureList = React.createClass({
    render: function() {
        var lectures = this.props.data.map(function(lecture, i) {
            return (
                <Lecture data={lecture} key={i} />
            );
        });

        return (
            <div className="list-group">
                {lectures}
            </div>
        );
    }
});

var Lecture = React.createClass({
    render: function() {
        var start = new Date(this.props.data.Date);
        var end = new Date(start.valueOf());
        end.setHours(end.getHours() + this.props.data.Length);

        var lectureStart = start.toTimeString().substring(0, 5);
        var lectureEnd = end.toTimeString().substring(0, 5);

        return (
            <a href="#" className="list-group-item">
                <h6 className="list-group-item-heading">{this.props.data.Name}</h6>
                <p className="list-group-item-text">
                    <span className="label label-info">{lectureStart} - {lectureEnd}</span>
                </p>
            </a>
        );
    }
});

React.render(
    <CourseSchedule />,
    document.body
);
