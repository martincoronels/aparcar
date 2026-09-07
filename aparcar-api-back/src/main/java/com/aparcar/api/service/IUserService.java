package com.aparcar.api.service;

import com.aparcar.api.entity.auth.InactiveUsersDto;

/**
 * Interface defining administrative user management operations.
 */
public interface IUserService {
    /**
     * Activates a previously inactive user.
     *
     * @param email The user's email address.
     */
    void activateUser(String email);

    /**
     * Retrieves all users currently pending activation.
     *
     * @return DTO containing the list of inactive users.
     */
    InactiveUsersDto getInactiveUsers();

    /**
     * Deletes a user from the system. Prevents a user from deleting themselves.
     *
     * @param email       The email of the user to be deleted.
     * @param callerEmail The email of the administrator initiating the deletion.
     */
    void deleteUser(String email, String callerEmail);
}
