package download

import (
	"io/ioutil"
	"net/http"

	"github.com/djimenez/iconv-go"
)

func urlToString(url string) (string, error) {
	res, err := http.Get(url)

	if err != nil {
		return "", err
	}

	defer res.Body.Close()

	r, err := iconv.NewReader(res.Body, "ISO-8859-1", "UTF-8")

	if err != nil {
		return "", err
	}

	b, err := ioutil.ReadAll(r)

	if err != nil {
		return "", err
	}

	return string(b), nil
}
