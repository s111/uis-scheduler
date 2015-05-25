package download

import (
	"bytes"
	"encoding/gob"
	"fmt"
	"log"
	"os"
	"regexp"
)

type File struct {
	Name string
	Html string
}

func (f *File) GobEncode() ([]byte, error) {
	w := new(bytes.Buffer)
	encoder := gob.NewEncoder(w)

	err := encoder.Encode(f.Name)

	if err != nil {
		return nil, err
	}

	err = encoder.Encode(f.Html)

	if err != nil {
		return nil, err
	}

	return w.Bytes(), nil
}

func (f *File) GobDecode(buf []byte) error {
	w := bytes.NewBuffer(buf)
	decoder := gob.NewDecoder(w)

	err := decoder.Decode(&f.Name)

	if err != nil {
		return err
	}

	return decoder.Decode(&f.Html)
}

func Download() {
	filter, err := urlToString("http://timeplan.uis.no/js/filter.js")

	if err != nil {
		log.Fatal(err)
	}

	programs := extractArray("progsetarray", filter)
	subjects := extractArray("modulearray", filter)

	progs := make(map[string]*File)
	subs := make(map[string]*File)

	n := 1

	for id, name := range programs {
		fmt.Printf("downloading program %d of %d\n", n, len(programs))

		html, err := urlToString(getProgramUrl(id))

		if err != nil {
			log.Fatal(err, id)
		}

		progs[id] = &File{name, html}

		n++
	}

	n = 0

	for id, name := range subjects {
		fmt.Printf("downloading subject %d of %d\n", n, len(subjects))

		html, err := urlToString(getSubjectUrl(id))

		if err != nil {
			log.Fatal(err, id)
		}

		subs[id] = &File{name, html}

		n++
	}

	f, err := os.Create("data")

	if err != nil {
		log.Fatal(err)
	}

	enc := gob.NewEncoder(f)
	enc.Encode(progs)
	enc.Encode(subs)

	f.Close()
}

func extractArray(name, data string) map[string]string {
	m := make(map[string]string)
	r := regexp.MustCompile(`\s*` + name + `\[\d+\]\s\[\d\]\s\=\s\"(.*)\";`)

	s := r.FindAllStringSubmatch(data, -1)

	for i := 0; i < len(s); i += 3 {
		name := s[i][1]
		id := s[i+2][1]

		if len(id) == 0 {
			continue
		}

		m[id] = name
	}

	return m
}

func getProgramUrl(id string) string {
	class := "programme+of+study"

	if id[:1] == "*" {
		id = id[1:]
		class = "student+set"
	}

	return "http://timeplan.uis.no/reporting/individual;" + class + ";id;" + id + "?weeks=1-33&height=100&width=100&days=1-6&periods=1-13&template=SWSCUST+" + class + "+individual+NOR"
}

func getSubjectUrl(id string) string {
	return "http://timeplan.uis.no/reporting/individual;module;id;" + id + "?weeks=1-33&height=100&width=100&days=1-6&periods=1-13&template=SWSCUST+module+individual+NOR"
}
