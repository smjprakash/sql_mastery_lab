function createSchemaElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createSchemaTable(headers, rows) {
  const table = createSchemaElement("table", "schema-table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headers.forEach(header => {
    headerRow.appendChild(
      createSchemaElement("th", "", header)
    );
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  rows.forEach(row => {
    const tableRow = document.createElement("tr");

    row.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent =
        value === null ? "NULL" : String(value);

      if (value === null) {
        cell.className = "schema-null-value";
      }

      tableRow.appendChild(cell);
    });

    tbody.appendChild(tableRow);
  });

  table.appendChild(tbody);
  return table;
}

function renderStandaloneSchema() {
  const container =
    document.getElementById("schemaContainer");

  if (!container || !window.SQL_SCHEMA) {
    throw new Error("Schema data or schema container is missing.");
  }

  Object.entries(window.SQL_SCHEMA).forEach(([tableName, info]) => {
    const card = createSchemaElement("section", "schema-card");
    const header = createSchemaElement("div", "schema-card-header");
    const titleGroup = document.createElement("div");

    titleGroup.appendChild(
      createSchemaElement("span", "schema-label", "TABLE")
    );
    titleGroup.appendChild(
      createSchemaElement("h2", "", tableName)
    );
    header.appendChild(titleGroup);
    header.appendChild(
      createSchemaElement(
        "span",
        "schema-count",
        `${info.columns.length} columns · ${info.sampleData.length} rows`
      )
    );
    card.appendChild(header);
    card.appendChild(
      createSchemaElement("p", "schema-description", info.description)
    );

    const columnsWrapper =
      createSchemaElement("div", "schema-table-wrapper");
    const columns = info.columns.map(column => [
      column.name,
      column.type,
      column.key,
      column.description
    ]);

    columnsWrapper.appendChild(
      createSchemaTable(
        ["Column", "Data Type", "Key", "Description"],
        columns
      )
    );
    card.appendChild(columnsWrapper);
    card.appendChild(
      createSchemaElement("h3", "schema-sample-title", "Sample Data")
    );

    const sampleWrapper =
      createSchemaElement("div", "schema-table-wrapper");

    sampleWrapper.appendChild(
      createSchemaTable(
        info.columns.map(column => column.name),
        info.sampleData
      )
    );
    card.appendChild(sampleWrapper);
    container.appendChild(card);
  });
}

try {
  renderStandaloneSchema();
}
catch (error) {
  console.error("Schema page failed to render:", error);

  const container =
    document.getElementById("schemaContainer");

  if (container) {
    container.textContent =
      "The schema could not be loaded. Please return to the practice page and try again.";
  }
}
