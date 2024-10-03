import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { accessToken, operation, folderId, fileId, folderName } =
      await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { message: "Access token is required" },
        { status: 400 }
      );
    }

    const driveApiUrl = "https://www.googleapis.com/drive/v3/files";

    //========================================================================

    if (operation === "listAllFilesAndFolders") {
      const response = await axios.get(driveApiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          q: "'me' in owners",
          fields: "files(id, name, mimeType)",
        },
      });

      return NextResponse.json({
        message: "success",
        filesAndFolders: response.data.files,
      });
    }

    //========================================================================

    if (operation === "listFilesAndFoldersInFolder") {
      if (!folderId) {
        return NextResponse.json(
          { message: "Folder ID is required" },
          { status: 400 }
        );
      }

      const response = await axios.get(driveApiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          q: `'${folderId}' in parents`,
          fields: "files(id, name, mimeType)",
        },
      });

      return NextResponse.json({
        message: "success",
        filesAndFolders: response.data.files,
      });
    }

    //========================================================================
    if (operation === "createFolder") {
      if (!folderName) {
        return NextResponse.json(
          { message: "Folder name is required" },
          { status: 400 }
        );
      }

      const folderResponse = await axios.post(
        driveApiUrl,
        {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const createdFolderId = folderResponse.data.id;

      if (!createdFolderId) {
        return NextResponse.json(
          { message: "Failed to create folder" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Folder created successfully",
        folderId: createdFolderId,
      });
    }

    //========================================================================
    if (operation === "moveFile") {
      if (!fileId) {
        return NextResponse.json(
          { message: "File ID is required" },
          { status: 400 }
        );
      }

      if (!folderId) {
        return NextResponse.json(
          { message: "Folder ID is required to move the file" },
          { status: 400 }
        );
      }

      const moveFileResponse = await axios.patch(
        `${driveApiUrl}/${fileId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            addParents: folderId,
            removeParents: "",
            fields: "id, parents",
          },
        }
      );

      return NextResponse.json({
        message: "File moved successfully",
        fileId: moveFileResponse.data.id,
        parents: moveFileResponse.data.parents,
      });
    }

    //========================================================================

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
