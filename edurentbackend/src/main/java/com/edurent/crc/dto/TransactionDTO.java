package com.edurent.crc.dto;

import java.util.Date;

public class TransactionDTO {
    private Long transactionId;
    private String transactionType;
    private String status;
    private Date startDate;
    private Date endDate;

    public TransactionDTO() {
    }

    public TransactionDTO(Long transactionId, String transactionType, String status, Date startDate, Date endDate) {
        this.transactionId = transactionId;
        this.transactionType = transactionType;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }
}
