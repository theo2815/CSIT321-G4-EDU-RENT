package com.edurent.crc.entity;

import jakarta.persistence.*;
import java.util.Set;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "schools")
public class SchoolEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "school_id")
    private Long schoolId;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "email_domain", nullable = false, unique = true)
    private String emailDomain;

    private String city;

    @OneToMany(mappedBy = "school", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "school-users")
    private Set<UserEntity> users;

    // Constructors
    public SchoolEntity() {
    }

    public SchoolEntity(String name, String emailDomain, String city) {
        this.name = name;
        this.emailDomain = emailDomain;
        this.city = city;
    }

    // Getters and Setters (Fixes SchoolService error)
    public Long getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(Long schoolId) {
        this.schoolId = schoolId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmailDomain() {
        return emailDomain;
    }

    public void setEmailDomain(String emailDomain) {
        this.emailDomain = emailDomain;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Set<UserEntity> getUsers() {
        return users;
    }

    public void setUsers(Set<UserEntity> users) {
        this.users = users;
    }

    // equals, hashCode, toString (excluding relationships)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SchoolEntity that = (SchoolEntity) o;
        return Objects.equals(schoolId, that.schoolId) &&
               Objects.equals(name, that.name) &&
               Objects.equals(emailDomain, that.emailDomain);
    }

    @Override
    public int hashCode() {
        return Objects.hash(schoolId, name, emailDomain);
    }

    @Override
    public String toString() {
        return "SchoolEntity{" +
                "schoolId=" + schoolId +
                ", name='" + name + '\'' +
                ", emailDomain='" + emailDomain + '\'' +
                ", city='" + city + '\'' +
                '}';
    }
}

