package com.edurent.crc.controller;

import org.springframework.web.bind.annotation.CrossOrigin; // Updated
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/conversations/{conversationId}/messages")
@CrossOrigin(origins = "*")
public class MessageController {


}

