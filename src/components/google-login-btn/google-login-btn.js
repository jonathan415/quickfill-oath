"use client";
import React, { useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { decodeEmailBody } from "@/commonFunctions";

const GoogleLoginButton = () => {
  const tokenExpirationTime = 300000; // 5 min in milli seconds

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const code = response.code;
        const apiResponse = await axios.post("/api/get-token", {
          googleAuthCode: code,
        });

        const tokenData = apiResponse.data.data;
        const userData = apiResponse.data.userData;
        tokenData.timestamp = Math.floor(Date.now() / 1000);
        localStorage.setItem("googleToken", JSON.stringify(tokenData));
        localStorage.setItem("userInfo", JSON.stringify(userData));
        await fetchSentEmails(tokenData.access_token);
        await fetchAllSpreadsheets(tokenData.access_token);
        await fetchSheetNames(tokenData.access_token);
        await fetchReadSpreadSheet(tokenData.access_token);
        await insertDataToSpreadsheet(tokenData.access_token);
        await deleteDataInSpreadsheet(tokenData.access_token);
        await updateSpreadSheetRequest(tokenData.access_token);
        await SortSpreadSheetRequest(tokenData.access_token);
        await listAllFilesAndFolders(tokenData.access_token);
        await listFilesAndFoldersInFolder(tokenData.access_token);
        await createFile(tokenData.access_token);
        await moveFile(tokenData.access_token);
      } catch (error) {
        console.error("Error:", error);
      }
    },
    flow: "auth-code",
    scope:
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
  });

  const checkTokenExpiration = async () => {
    const tokenData = JSON.parse(localStorage.getItem("googleToken"));
    if (tokenData) {
      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExpiry = tokenData.timestamp + tokenData.expires_in;

      if (currentTime < tokenExpiry) {
        console.log("valid token");
      } else {
        try {
          console.log("expired");
          const refreshResponse = await axios.post("/api/refresh-token", {
            refreshToken: tokenData.refresh_token,
          });
          const newTokenData = { ...tokenData, ...refreshResponse.data.data };
          newTokenData.timestamp = Math.floor(Date.now() / 1000);

          localStorage.setItem("googleToken", JSON.stringify(newTokenData));
          localStorage.setItem(
            "userInfo",
            JSON.stringify(refreshResponse?.data?.userData)
          );
          await fetchSentEmails(newTokenData.access_token);
        } catch (error) {
          console.error("Error:", error);
          localStorage.removeItem("googleToken");
        }
      }
    }
  };

  const fetchSentEmails = async (accessToken) => {
    try {
      const response = await axios.post("/api/get-user-sent-emails", {
        accessToken: accessToken,
      });
      console.log("Sent emails:", response.data);
      const decodeEmails = decodeEmailBody(response.data.data);
      console.log("decoded emails", decodeEmails);
    } catch (error) {
      console.error("Error fetching sent emails:", error);
    }
  };

  const fetchAllSpreadsheets = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-spreadsheet", {
        accessToken: accessToken,
        operation: "getUserSpreadSheets",
      });
      console.log("Spreadsheets:", response.data.spreadsheets);
    } catch (error) {
      console.error("Error fetching spreadsheets:", error);
    }
  };

  const fetchSheetNames = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-spreadsheet", {
        accessToken,
        operation: "selectedSpreadsheetSheetNames",
        sheetId: "1yUoZAIy6oW01prq3BTspuO_MPuk_uKUyQ359wb-nsYQ",
      });

      console.log("sheet names of of selected excel file", response.data);
    } catch (error) {
      console.error("Error fetching sheet data:", error);
    }
  };

  const fetchReadSpreadSheet = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-spreadsheet", {
        accessToken,
        operation: "readSpreadSheetData",
        sheetId: "1yUoZAIy6oW01prq3BTspuO_MPuk_uKUyQ359wb-nsYQ",
        spreadsheetName: "AIC",
      });

      console.log("Read Spread Sheet", response.data);
    } catch (error) {
      console.error("Error fetching sheet data:", error);
    }
  };

  const insertDataToSpreadsheet = async (accessToken) => {
    const dataToInsert = [
      ["87", "83", "A", "0", "PIAICTEST1", "Test Test"],
      ["87", "83", "A", "0", "PIAICTEST2", "Test Test"],
      ["87", "83", "A", "0", "PIAICTEST3", "Test Test"],
    ];

    try {
      const response = await axios.post("/api/google-spreadsheet", {
        accessToken: accessToken,
        operation: "insertDataInToSpreadSheet",
        sheetId: "1yUoZAIy6oW01prq3BTspuO_MPuk_uKUyQ359wb-nsYQ",
        spreadsheetName: "AIC",
        data: dataToInsert,
      });
      console.log("data inserted?", response);
    } catch (error) {
      console.error(
        "Error inserting data:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const deleteDataInSpreadsheet = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-spreadsheet", {
        accessToken: accessToken,
        operation: "deleteMatchingDataInSpreadSheet",
        sheetId: "1yUoZAIy6oW01prq3BTspuO_MPuk_uKUyQ359wb-nsYQ",
        spreadsheetName: "AIC",
        data: {
          columnName: "Name",
          matchValue: "Hassan Imtiaz",
        },
      });
      console.log("deletion", response);
    } catch (error) {
      console.error(
        "Error deleting data:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const updateSpreadSheetRequest = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-spreadsheet", {
        accessToken: accessToken,
        operation: "updateMatchingDataInSpreadSheet",
        sheetId: "1yUoZAIy6oW01prq3BTspuO_MPuk_uKUyQ359wb-nsYQ",
        spreadsheetName: "AIC",
        data: {
          columnName: "Roll Number",
          matchValue: "PIAIC71081",
          newData: ["87", "83", "A", "0", "PIAICTEST", "Test Test"],
          isUpdateMutiple: false,
        },
      });

      console.log("Update successful:", response.data);
    } catch (error) {
      console.error(
        "Error updating data:",
        error.response?.data || error.message
      );
    }
  };

  const SortSpreadSheetRequest = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-spreadsheet", {
        accessToken: accessToken,
        operation: "sortDataInSpreadSheet",
        sheetId: "1yUoZAIy6oW01prq3BTspuO_MPuk_uKUyQ359wb-nsYQ",
        spreadsheetName: "AIC",
        data: {
          columnName: "Name",
          order: "ASC", // ASC || DESC
        },
      });

      console.log("Sorting successful:", response.data);
    } catch (error) {
      console.error(
        "Error updating data:",
        error.response?.data || error.message
      );
    }
  };

  const listAllFilesAndFolders = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-drive", {
        accessToken: accessToken,
        operation: "listAllFilesAndFolders",
      });

      console.log("Files and Folders:", response.data.filesAndFolders);
    } catch (error) {
      console.error(
        "Error listing files and folders:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const listFilesAndFoldersInFolder = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-drive", {
        accessToken: accessToken,
        operation: "listFilesAndFoldersInFolder",
        folderId: "1R4VcG5es5PvTyLrcjHr86n1fD9BjUvgP",
      });

      console.log(
        "Files and Folders inside folder:",
        response.data.filesAndFolders
      );
    } catch (error) {
      console.error(
        "Error listing files and folders inside folder:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const createFile = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-drive", {
        accessToken: accessToken,
        operation: "createFolder",
        folderName: "TestABC2",
      });

      console.log(response.data);
    } catch (error) {
      console.error(
        "Error moving file:",
        error.response?.data || error.message
      );
    }
  };

  const moveFile = async (accessToken) => {
    try {
      const response = await axios.post("/api/google-drive", {
        accessToken: accessToken,
        operation: "moveFile",
        fileId: "1QP49yUchWhOjb7FQIRm6BJH5BzfmAoA1SqOoVo_2ZVc",
        folderId: "1TA3NpyKE1FVnni5NNp5woTbpANG5hH5j",
      });

      console.log(response.data);
    } catch (error) {
      console.error(
        "Error moving file:",
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    checkTokenExpiration();
    const intervalId = setInterval(() => {
      checkTokenExpiration();
    }, tokenExpirationTime);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <button
      onClick={() => login()}
      style={{ padding: "10px 20px", fontSize: "16px" }}
    >
      Sign in with Google 🚀
    </button>
  );
};

export default GoogleLoginButton;
