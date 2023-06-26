import React, { useMemo } from "react";
import { Table } from "./Table";
import { Column } from "react-table";

// Define a sample data set
const data = [
  { id: 1, name: "John Doe", age: 30 },
  { id: 2, name: "Jane Smith", age: 25 },
];

// Define column headers
const columns = [
  { Header: "ID", accessor: "id" },
  { Header: "Name", accessor: "name" },
  { Header: "Age", accessor: "age" },
];

describe("<Table />", () => {
  it("renders", () => {
    cy.mount(<Table columns={columns} data={data} />);
  });
});
