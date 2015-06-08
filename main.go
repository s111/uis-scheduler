package main

import (
	"bytes"
	"encoding/gob"
	"encoding/json"
	"errors"
	"flag"
	"log"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/go-martini/martini"
	"github.com/martini-contrib/render"
	"github.com/s111/uis-scheduler/download"
)

const (
	dayColumnsSelector = "table[border='1'] > tbody > tr:first-child > td:nth-child(n+2)"

	lectureRowsSelector    = "table[border='1'] > tbody > tr:nth-child(n+2)"
	lectureColumnsSelector = "table[border='1'] > tbody > tr:nth-child(n+2) > td:nth-child(n+2)"

	lecureRoomsSelector     = "font[color='#000000']"
	lectureLecturerSelector = "font[color='#000080']"
	lectureNameSelector     = "font[color='#FF0000']"
	lectureWeeksSelector    = "font[color='#800000']"
)

var dl = flag.Bool("download", false, "force download programs and subjects")

type Program struct {
	Name     string
	Subjects map[string]bool
}

func (p Program) MarshalJSON() ([]byte, error) {
	subjects := make([]string, 0)

	for id := range p.Subjects {
		subjects = append(subjects, id)
	}

	return json.Marshal(struct {
		Name     string
		Subjects []string
	}{
		p.Name,
		subjects,
	})
}

type Subject struct {
	Name     string
	Id       string
	Lectures []Lecture
}

type AltSubject struct {
	Name string
	Id   string
}

type Lecture struct {
	Name      string
	Rooms     []string
	Lecturers []string
	Date      time.Time
	Length    int
}

type Programs []Program

func (p Programs) Len() int {
	return len(p)
}

func (p Programs) Less(i, j int) bool {
	return p[i].Name < p[j].Name
}

func (p Programs) Swap(i, j int) {
	p[i], p[j] = p[j], p[i]
}

type AltSubjects []AltSubject

func (s AltSubjects) Len() int {
	return len(s)
}

func (s AltSubjects) Less(i, j int) bool {
	return s[i].Name < s[j].Name
}

func (s AltSubjects) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func main() {
	flag.Parse()

	if _, err := os.Stat("data"); os.IsNotExist(err) {
		*dl = true
	}

	if *dl {
		download.Download()
	}

	var programsFileList map[string]*download.File
	var subjectsFileList map[string]*download.File

	f, err := os.Open("data")

	if err != nil {
		log.Fatal(err)
	}

	dec := gob.NewDecoder(f)
	dec.Decode(&programsFileList)
	dec.Decode(&subjectsFileList)

	f.Close()

	subjectIdLookupTable := createLookupTable(subjectsFileList)
	programs := createPrograms(programsFileList, subjectIdLookupTable)

	subjects := make(map[string]*Subject)

	for id, subjectFile := range subjectsFileList {
		subject := &Subject{Name: subjectFile.Name, Id: id}

		b := bytes.NewBufferString(subjectFile.Html)

		doc, err := goquery.NewDocumentFromReader(b)

		if err != nil {
			log.Fatal(err)
		}

		dayColumns := doc.Find(dayColumnsSelector)
		t, err := createTraverser(dayColumns)

		if err != nil {
			log.Fatal(err)
		}

		lectureRows := doc.Find(lectureRowsSelector)

		for _, tr := range lectureRows.Nodes {
			for _, td := range goquery.NewDocumentFromNode(tr).Find(lectureColumnsSelector).Nodes {
				lectureCell := goquery.NewDocumentFromNode(td)

				if rowspan, ok := lectureCell.Attr("rowspan"); ok {
					length, err := strconv.Atoi(rowspan)

					if err != nil {
						log.Fatal(err)
					}

					name := lectureCell.Find(lectureNameSelector).Text()
					weekRange := lectureCell.Find(lectureWeeksSelector).Text()
					weeks, err := expandRange(weekRange)

					rooms := strings.Split(lectureCell.Find(lecureRoomsSelector).Text(), ", ")
					lecturers := strings.Split(lectureCell.Find(lectureLecturerSelector).Text(), ", ")

					if len(rooms) == 1 && len(rooms[0]) < 1 {
						rooms = make([]string, 0)
					}

					if len(lecturers) == 1 && len(lecturers[0]) < 1 {
						lecturers = make([]string, 0)
					}

					if err != nil {
						log.Fatal(err)
					}

					for _, week := range weeks {
						date := getDate(2015, week, t.getDay()).Add(time.Duration(t.getHour()+8)*time.Hour + 15*time.Minute)
						subject.Lectures = append(subject.Lectures, Lecture{name, rooms, lecturers, date.Local(), length})
					}

					t.block(length)
				} else {
					t.block(1)
				}
			}
		}

		subjects[id] = subject
	}

	m := martini.Classic()
	m.Use(render.Renderer())

	slist := make(AltSubjects, 0)

	for id, subject := range subjects {
		slist = append(slist, AltSubject{Name: subject.Name, Id: id})

		func(subject *Subject) {
			m.Get("/lectures/"+id+".json", func(r render.Render) {
				r.JSON(200, subject)
			})
		}(subject)
	}

	sort.Sort(slist)

	m.Get("/subjects.json", func(r render.Render) {
		r.JSON(200, &slist)
	})

	sort.Sort(programs)

	m.Get("/programs.json", func(r render.Render) {
		r.JSON(200, &programs)
	})

	m.Run()
}

func createLookupTable(subjectsFileList map[string]*download.File) map[string]string {
	lookupTable := make(map[string]string)

	for id, subjectFile := range subjectsFileList {
		b := bytes.NewBufferString(subjectFile.Html)

		doc, err := goquery.NewDocumentFromReader(b)

		if err != nil {
			log.Fatal(err)
		}

		for _, n := range doc.Find(lectureNameSelector).Nodes {
			name := n.FirstChild.Data
			lookupTable[name] = id
		}
	}

	return lookupTable
}

func createPrograms(programsFileList map[string]*download.File, subjectIdLookupTable map[string]string) Programs {
	var programs []Program

	for _, programFile := range programsFileList {
		program := Program{programFile.Name, make(map[string]bool)}

		b := bytes.NewBufferString(programFile.Html)

		doc, err := goquery.NewDocumentFromReader(b)

		if err != nil {
			log.Fatal(err)
		}

		for _, n := range doc.Find(lectureNameSelector).Nodes {
			name := n.FirstChild.Data
			program.Subjects[subjectIdLookupTable[name]] = true
		}

		programs = append(programs, program)
	}

	return programs
}

func createTraverser(days *goquery.Selection) (*traverser, error) {
	var (
		columns       = 0
		rows          = 13
		columnsPerDay = make([]int, 6)
	)

	for day, td := range days.Nodes {
		selection := goquery.NewDocumentFromNode(td)

		if colspan, ok := selection.Attr("colspan"); ok {
			c, err := strconv.Atoi(colspan)

			if err != nil {
				return nil, err
			}

			columnsPerDay[day] = c
			columns += c
		} else {
			return nil, errors.New("missing key")
		}
	}

	return newTraverser(rows, columns, columnsPerDay), nil
}
