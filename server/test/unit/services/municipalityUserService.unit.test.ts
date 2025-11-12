import {
  createMunicipalityUser,
  getAllMunicipalityUsers,
  getMunicipalityUserById,
  updateMunicipalityUser,
  deleteMunicipalityUser,
  findMunicipalityUserByEmail,
} from "../../../src/services/municipalityUserService";

import * as userService from "../../../src/services/userService";
import { Roles } from "../../../src/interfaces/UserDTO";

jest.mock("../../../src/services/userService");
const mockCreateUser = userService.createUser as jest.MockedFunction<typeof userService.createUser>;
const mockFindByEmail = userService.findByEmail as jest.MockedFunction<typeof userService.findByEmail>;
const mockFindById = userService.findById as jest.MockedFunction<typeof userService.findById>;
const mockUpdateUser = userService.updateUser as jest.MockedFunction<typeof userService.updateUser>;
const mockDeleteUser = userService.deleteUser as jest.MockedFunction<typeof userService.deleteUser>;
const mockFindUsersByRoles = userService.findUsersByRoles as jest.MockedFunction<typeof userService.findUsersByRoles>;

describe("municipalityUserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createMunicipalityUser should call createUser and return created user", async () => {
    const payload = { email: "a@b.com", first_name: "A", last_name: "B", password: "p", salt: "s", role: Roles.ADMINISTRATOR } as any;
    const created = { id: 1, ...payload } as any;
    mockCreateUser.mockResolvedValue(created);

    const res = await createMunicipalityUser(payload);
    expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({ email: payload.email, role: payload.role }));
    expect(res).toEqual(created);
  });

  it("getAllMunicipalityUsers should call findUsersByRoles", async () => {
    const users = [{ id: 1, role: Roles.PUBLIC_RELATIONS } as any];
    mockFindUsersByRoles.mockResolvedValue(users);

    const res = await getAllMunicipalityUsers();
    expect(mockFindUsersByRoles).toHaveBeenCalled();
    // ensure ADMINISTRATOR is excluded from the roles passed to findUsersByRoles
    const calledArg = mockFindUsersByRoles.mock.calls[0][0] as any[];
    expect(calledArg).not.toContain(Roles.ADMINISTRATOR);
    expect(res).toEqual(users);
  });

  it("getMunicipalityUserById should return user when role is municipality role", async () => {
    const u = { id: 2, role: Roles.TECHNICAL_OFFICE } as any;
    mockFindById.mockResolvedValue(u);
    const res = await getMunicipalityUserById(2);
    expect(mockFindById).toHaveBeenCalledWith(2);
    expect(res).toEqual(u);
  });

  it("getMunicipalityUserById should return null for non-municipality role", async () => {
    const u = { id: 3, role: 'CITIZEN' } as any;
    mockFindById.mockResolvedValue(u);
    const res = await getMunicipalityUserById(3);
    expect(res).toBeNull();
  });

  it("getMunicipalityUserById should return null when user not found", async () => {
    mockFindById.mockResolvedValue(null);
    const res = await getMunicipalityUserById(999);
    expect(mockFindById).toHaveBeenCalledWith(999);
    expect(res).toBeNull();
  });

  it("getMunicipalityUserById should work for all municipality roles", async () => {
    // Test PUBLIC_RELATIONS
    const publicRelationsUser = { id: 10, role: Roles.PUBLIC_RELATIONS } as any;
    mockFindById.mockResolvedValue(publicRelationsUser);
    const res1 = await getMunicipalityUserById(10);
    expect(res1).toEqual(publicRelationsUser);

    // Test TECHNICAL_OFFICE
    const technicalUser = { id: 11, role: Roles.TECHNICAL_OFFICE } as any;
    mockFindById.mockResolvedValue(technicalUser);
    const res2 = await getMunicipalityUserById(11);
    expect(res2).toEqual(technicalUser);
  });

  it("updateMunicipalityUser should return updated user when exists", async () => {
    const existing = { id: 4, role: Roles.PUBLIC_RELATIONS } as any;
    mockFindById.mockResolvedValue(existing);
    const updated = { id: 4, first_name: 'X' } as any;
    mockUpdateUser.mockResolvedValue(updated);

    const res = await updateMunicipalityUser(4, { first_name: 'X' } as any);
    expect(mockUpdateUser).toHaveBeenCalledWith(4, expect.any(Object));
    expect(res).toEqual(updated);
  });

  it("updateMunicipalityUser should return null when user not found", async () => {
    mockFindById.mockResolvedValue(null);
    const res = await updateMunicipalityUser(999, { first_name: 'X' } as any);
    expect(res).toBeNull();
  });

  it("updateMunicipalityUser should return null when user is not municipality user", async () => {
    const citizenUser = { id: 4, role: 'CITIZEN' } as any;
    mockFindById.mockResolvedValue(citizenUser);
    const res = await updateMunicipalityUser(4, { first_name: 'X' } as any);
    expect(res).toBeNull();
  });

  it("updateMunicipalityUser should handle all fields", async () => {
    const existing = { id: 4, role: Roles.PUBLIC_RELATIONS } as any;
    mockFindById.mockResolvedValue(existing);
    const updated = { id: 4, first_name: 'John', last_name: 'Doe' } as any;
    mockUpdateUser.mockResolvedValue(updated);

    const updateData = {
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'newpassword',
      salt: 'newsalt',
      role: Roles.TECHNICAL_OFFICE
    };

    const res = await updateMunicipalityUser(4, updateData);
    
    expect(mockUpdateUser).toHaveBeenCalledWith(4, {
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password: 'newpassword',
      salt: 'newsalt',
      role: Roles.TECHNICAL_OFFICE
    });
    expect(res).toEqual(updated);
  });

  it("updateMunicipalityUser should skip undefined fields", async () => {
    const existing = { id: 4, role: Roles.PUBLIC_RELATIONS } as any;
    mockFindById.mockResolvedValue(existing);
    const updated = { id: 4, first_name: 'John' } as any;
    mockUpdateUser.mockResolvedValue(updated);

    const updateData = {
      first_name: 'John',
      email: undefined,
      password: undefined,
    };

    await updateMunicipalityUser(4, updateData);
    
    expect(mockUpdateUser).toHaveBeenCalledWith(4, {
      first_name: 'John'
    });
  });

  it("deleteMunicipalityUser should delete when exists and return true", async () => {
    const existing = { id: 5, role: Roles.PUBLIC_RELATIONS } as any;
    mockFindById.mockResolvedValue(existing);
    mockDeleteUser.mockResolvedValue(true as any);

    const res = await deleteMunicipalityUser(5);
    expect(mockDeleteUser).toHaveBeenCalledWith(5);
    expect(res).toBeTruthy();
  });

  it("deleteMunicipalityUser should return false when user not found", async () => {
    mockFindById.mockResolvedValue(null);
    const res = await deleteMunicipalityUser(999);
    expect(res).toBe(false);
  });

  it("deleteMunicipalityUser should return false when user is not municipality user", async () => {
    const citizenUser = { id: 5, role: 'CITIZEN' } as any;
    mockFindById.mockResolvedValue(citizenUser);
    const res = await deleteMunicipalityUser(5);
    expect(res).toBe(false);
  });

  it("findMunicipalityUserByEmail should return null when role not municipality", async () => {
    const u = { id: 6, role: 'CITIZEN' } as any;
    mockFindByEmail.mockResolvedValue(u);
    const res = await findMunicipalityUserByEmail('x@x');
    expect(res).toBeNull();
  });

  it("findMunicipalityUserByEmail should return null when user not found", async () => {
    mockFindByEmail.mockResolvedValue(null);
    const res = await findMunicipalityUserByEmail('notfound@example.com');
    expect(res).toBeNull();
  });

  it("findMunicipalityUserByEmail should return user when municipality role", async () => {
    const municipalityUser = { id: 7, role: Roles.TECHNICAL_OFFICE, email: 'tech@example.com' } as any;
    mockFindByEmail.mockResolvedValue(municipalityUser);
    const res = await findMunicipalityUserByEmail('tech@example.com');
    expect(mockFindByEmail).toHaveBeenCalledWith('tech@example.com');
    expect(res).toEqual(municipalityUser);
  });

  it("createMunicipalityUser should set default telegram and notification values", async () => {
    const payload = { 
      email: "test@example.com", 
      first_name: "Test", 
      last_name: "User", 
      password: "hashedpass", 
      salt: "salt123", 
      role: Roles.PUBLIC_RELATIONS 
    } as any;
    const created = { id: 1, ...payload } as any;
    mockCreateUser.mockResolvedValue(created);

    await createMunicipalityUser(payload);
    
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      password: "hashedpass",
      salt: "salt123",
      role: Roles.PUBLIC_RELATIONS,
      telegram_username: null,
      email_notifications_enabled: true,
    });
  });

  it("getAllMunicipalityUsers should exclude ADMINISTRATOR role", async () => {
    const users = [
      { id: 1, role: Roles.PUBLIC_RELATIONS } as any,
      { id: 2, role: Roles.TECHNICAL_OFFICE } as any
    ];
    mockFindUsersByRoles.mockResolvedValue(users);

    await getAllMunicipalityUsers();
    
    const calledArg = mockFindUsersByRoles.mock.calls[0][0] as any[];
    expect(calledArg).toEqual([Roles.PUBLIC_RELATIONS, Roles.TECHNICAL_OFFICE]);
    expect(calledArg).not.toContain(Roles.ADMINISTRATOR);
  });
});
