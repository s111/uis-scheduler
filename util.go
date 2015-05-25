package main

import (
	"errors"
	"log"
	"strconv"
	"strings"
	"time"
)

func expandRange(s string) ([]int, error) {
	var r []int

	ns := strings.Replace(s, " ", "", -1)

	for _, part := range strings.Split(ns, ",") {
		if a := strings.Split(part, "-"); len(a) == 2 {
			start, err := strconv.Atoi(a[0])

			if err != nil {
				return nil, err
			}

			end, err := strconv.Atoi(a[1])

			if err != nil {
				return nil, err
			}

			for i := start; i <= end; i++ {
				r = append(r, i)
			}

			continue
		} else if len(a) > 2 {
			return nil, errors.New("expandRange: invalid range supplied")
		}

		n, err := strconv.Atoi(part)

		if err != nil {
			return nil, err
		}

		r = append(r, n)
	}

	return r, nil
}

func getDate(year, week, day int) time.Time {
	loc, err := time.LoadLocation("Europe/Oslo")

	if err != nil {
		log.Fatal(err)
	}

	janFirst := time.Date(2015, 1, 1, 0, 0, 0, 0, loc)
	dayOffset := time.Thursday - janFirst.Weekday()
	firstThursday := janFirst.AddDate(0, 0, int(dayOffset))
	_, firstWeek := firstThursday.ISOWeek()

	weekNum := week

	if firstWeek <= 1 {
		weekNum -= 1
	}

	thursday := firstThursday.AddDate(0, 0, weekNum*7)
	monday := thursday.AddDate(0, 0, -3)

	return monday.AddDate(0, 0, day)
}
