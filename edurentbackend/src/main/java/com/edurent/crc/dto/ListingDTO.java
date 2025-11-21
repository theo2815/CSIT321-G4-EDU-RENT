package com.edurent.crc.dto;

public class ListingDTO {
    private Long listingId;
    private String title;
    private Double price;
    private String imageUrl; // Just the cover photo URL
    private UserDTO owner;

    // Constructors, Getters, Setters
    public ListingDTO() {}
    
    public Long getListingId() { return listingId; }
    public void setListingId(Long listingId) { this.listingId = listingId; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public UserDTO getOwner() { return owner; }
    public void setOwner(UserDTO owner) { this.owner = owner; }
}