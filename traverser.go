package main

type traverser struct {
	rows    int
	columns int

	columnsPerDay []int
	table         [][]bool

	row    int
	column int
}

func newTraverser(rows int, columns int, columnsPerDay []int) *traverser {
	table := make([][]bool, rows)

	for row := range table {
		table[row] = make([]bool, columns)
	}

	t := traverser{
		rows:          rows,
		columns:       columns,
		columnsPerDay: columnsPerDay,
		table:         table,
	}

	return &t
}

func (t *traverser) getHour() int {
	return t.row
}

func (t *traverser) getDay() int {
	var day, columns int

	for day = range t.columnsPerDay {
		columns += t.columnsPerDay[day]

		if t.column < columns {
			break
		}
	}

	return day
}

func (t *traverser) block(length int) {
	for i := 0; i < length; i++ {
		t.table[t.row+i][t.column] = true
	}

	t.advance()
}

func (t *traverser) advance() {
	t.column++

	if t.column == t.columns {
		t.column = 0
		t.row++
	}

	if t.row < t.rows && t.table[t.row][t.column] {
		t.advance()
	}
}
