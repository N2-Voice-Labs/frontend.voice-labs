/** Languages the workspace offers when configuring agents and voices. */
export const languageOptions = [
  { id: "en", label: "English" },
  { id: "ru", label: "Russian" },
];

export const languageName = (id: string) => languageOptions.find((item) => item.id === id)?.label ?? id.toUpperCase();
