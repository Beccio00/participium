import { toCitizenProfileDTO } from "../../../src/interfaces/CitizenDTO";

describe("CitizenDTO", () => {
  it("toCitizenProfileDTO maps user with photo", () => {
    const user: any = {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      telegram_username: "johndoe",
      email_notifications_enabled: true,
      photo: { url: "http://minio/photo.jpg" },
    };

    const dto = toCitizenProfileDTO(user);
    expect(dto).toEqual({
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      telegramUsername: "johndoe",
      emailNotificationsEnabled: true,
      photoUrl: "http://minio/photo.jpg",
    });
  });

  it("toCitizenProfileDTO handles nulls and missing photo", () => {
    const user: any = {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      telegram_username: null,
      email_notifications_enabled: false,
      photo: null,
    };

    const dto = toCitizenProfileDTO(user);
    expect(dto).toEqual({
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      telegramUsername: null,
      emailNotificationsEnabled: false,
      photoUrl: null,
    });
  });
});
