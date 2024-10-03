export const decodeEmailBody = (data) => {
  if (data.length === 0) return [];

  data.forEach((mail) => {
    if (mail?.payload?.parts) {
      mail.payload.parts.forEach((item) => {
        if (item.mimeType === "text/html" || item.mimeType === "text/plain") {
          const decodedString = atob(
            item.body.data.replace(/-/g, "+").replace(/_/g, "/"),
          );
          item.decodeEmailBody = decodedString;
        }
      });
    }
  });

  return data;
};
