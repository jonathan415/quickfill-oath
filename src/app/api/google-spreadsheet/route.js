import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { accessToken, operation, sheetId, spreadsheetName, data } =
      await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { message: "Access token is required" },
        { status: 400 }
      );
    }

    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;

    //=====================================================================================
    if (operation === "getUserSpreadSheets") {
      const response = await axios.get(
        "https://www.googleapis.com/drive/v3/files",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            // q: "mimeType='application/vnd.google-apps.spreadsheet' and 'me' in owners",
            q: "mimeType='application/vnd.google-apps.spreadsheet' and 'me' in writers",
            // q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: "files(id, name)",
          },
        }
      );

      return NextResponse.json({
        message: "success",
        spreadsheets: response.data.files,
      });
    }
    /* if (operation === "getUserSpreadSheets") {
      const allSpreadsheets = [];

      const fetchSpreadsheetsInFolder = async (folderId = null) => {
        const response = await axios.get(
          "https://www.googleapis.com/drive/v3/files",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              q: folderId
                ? `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`
                : "mimeType='application/vnd.google-apps.spreadsheet' and 'me' in writers",
              fields: "files(id, name, parents)",
            },
          },
        );

        allSpreadsheets.push(...response.data.files);

        const folderResponse = await axios.get(
          "https://www.googleapis.com/drive/v3/files",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              q: folderId
                ? `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder'`
                : "mimeType='application/vnd.google-apps.folder'",
              fields: "files(id)",
            },
          },
        );

        for (const folder of folderResponse.data.files) {
          await fetchSpreadsheetsInFolder(folder.id);
        }
      };

      await fetchSpreadsheetsInFolder();

      return NextResponse.json({
        message: "success",
        spreadsheets: allSpreadsheets,
      });
    } */

    //=====================================================================================

    if (operation === "selectedSpreadsheetSheetNames") {
      const response = await axios.get(sheetsApiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const sheetNames = response.data.sheets.map(
        (sheet) => sheet.properties.title
      );

      return NextResponse.json({
        message: "success",
        sheetNames,
      });
    }

    if (operation === "readSpreadSheetData") {
      const response = await axios.get(
        `${sheetsApiUrl}/values/${spreadsheetName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return NextResponse.json({
        message: "success",
        data: response.data.values,
      });
    }

    //=====================================================================================

    if (operation === "insertDataInToSpreadSheet") {
      const response = await axios.post(
        `${sheetsApiUrl}/values/${spreadsheetName}:append`,
        {
          values: data,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            valueInputOption: "RAW",
          },
        }
      );

      return NextResponse.json({
        message: "Data inserted successfully",
        response: response.data,
      });
    }

    //=====================================================================================

    if (operation === "deleteMatchingDataInSpreadSheet") {
      const { columnName, matchValue } = data;
      const currentData = await axios.get(
        `${sheetsApiUrl}/values/${spreadsheetName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const headerIndex = currentData.data.values[0].indexOf(columnName);

      const hasMatchingValues = currentData.data.values.filter(
        (row, index) => row[headerIndex] === matchValue
      );

      if (hasMatchingValues.length === 0) {
        return NextResponse.json(
          { message: "No Matching Value Found to delete." },
          { status: 400 }
        );
      }

      const filteredData = currentData.data.values.filter(
        (row, index) => index === 0 || row[headerIndex] !== matchValue
      );

      const response = await axios.put(
        `${sheetsApiUrl}/values/${spreadsheetName}`,
        {
          values: filteredData,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            valueInputOption: "RAW",
          },
        }
      );

      return NextResponse.json({
        message: "Data deleted successfully",
        response: response.data,
      });
    }

    //=====================================================================================

    if (operation === "updateMatchingDataInSpreadSheet") {
      const { columnName, matchValue, newData, isUpdateMutiple } = data;

      const currentDataResponse = await axios.get(
        `${sheetsApiUrl}/values/${spreadsheetName}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const currentData = currentDataResponse.data.values;
      const headerRow = currentData[0];
      const columnIndex = headerRow.indexOf(columnName);

      if (columnIndex === -1) {
        return NextResponse.json(
          { message: "Column not found" },
          { status: 400 }
        );
      }

      let updatedRows = [];
      if (!isUpdateMutiple) {
        const rowIndex = currentData.findIndex(
          (row) => row[columnIndex] === matchValue
        );
        const updatedRow = [...newData];
        updatedRows.push({ rowIndex, updatedRow });
      } else {
        currentData.forEach((row, rowIndex) => {
          if (row[columnIndex] === matchValue) {
            const updatedRow = [...row];
            updatedRow.splice(0, newData.length, ...newData);
            updatedRows.push({ rowIndex, updatedRow });
          }
        });
      }

      if (!isUpdateMutiple) {
        if (updatedRows[0].rowIndex === -1) {
          return NextResponse.json(
            { message: "No rows found with matching value" },
            { status: 404 }
          );
        }
      }

      if (updatedRows.length === 0) {
        return NextResponse.json(
          { message: "No rows found with matching value" },
          { status: 404 }
        );
      }

      for (let { rowIndex, updatedRow } of updatedRows) {
        await axios.put(
          `${sheetsApiUrl}/values/${spreadsheetName}!A${rowIndex + 1}`,
          {
            values: [updatedRow],
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            params: {
              valueInputOption: "RAW",
            },
          }
        );
      }

      return NextResponse.json({
        message: `Data updated successfully for ${updatedRows.length} row(s)`,
        updatedRows: updatedRows.map((row) => row.rowIndex + 1),
      });
    }

    //=====================================================================================

    if (operation === "sortDataInSpreadSheet") {
      const { columnName, order } = data;
      const currentDataResponse = await axios.get(
        `${sheetsApiUrl}/values/${spreadsheetName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const currentData = currentDataResponse.data.values;
      const headerRow = currentData[0];
      const columnIndex = headerRow.indexOf(columnName);

      const sortedData = currentData.slice(1).sort((a, b) => {
        const aValue = a[columnIndex];
        const bValue = b[columnIndex];
        return order === "ASC"
          ? aValue > bValue
            ? 1
            : -1
          : aValue < bValue
            ? 1
            : -1;
      });
      sortedData.unshift(currentData[0]);

      const response = await axios.put(
        `${sheetsApiUrl}/values/${spreadsheetName}`,
        {
          values: sortedData,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            valueInputOption: "RAW",
          },
        }
      );

      return NextResponse.json({
        message: "Data sorted successfully",
        response: response.data,
      });
    }

    return NextResponse.json({ message: "Operation Invalid" }, { status: 400 });
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    return NextResponse.json(
      { error: `Internal Server Error` },
      { status: 500 }
    );
  }
}
