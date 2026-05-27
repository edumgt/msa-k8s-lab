package org.example.chatservice.controller;


import lombok.extern.slf4j.Slf4j;
import org.example.chatservice.model.Message;
import org.example.chatservice.model.User;
import org.example.chatservice.service.MessageService;
import org.example.chatservice.service.UserServiceClient;
import org.example.chatservice.service.WebSocketDispatchService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
public class MessageController {

    private final MessageService messageService;
    private final UserServiceClient userServiceClient;
    private final WebSocketDispatchService webSocketDispatchService;



    public MessageController(
            MessageService messageService,
            UserServiceClient userServiceClient,
            WebSocketDispatchService webSocketDispatchService
    ) {
        this.messageService = messageService;
        this.userServiceClient = userServiceClient;
        this.webSocketDispatchService = webSocketDispatchService;
    }

    @MessageMapping("/sendMessage") // event which will be triggered
    public void sendMessage(Message message){
        Message savedMessage = messageService.saveMessage("public", message.getSender(), message.getContent());
        webSocketDispatchService.dispatchPublicMessage(savedMessage);
    }

    @GetMapping("/chat/search")
    public Mono<List<User>> searchUsers(@RequestParam("query") String query){
        log.info("inside this block");
        return userServiceClient.searchUsers(query).collectList();
//        return userServiceClient.searchUsers(query).collectList().block();
    }

    @GetMapping("/chat/messages")
    public List<Message> getMessages(){
        return messageService.getMessagesForConversation("public");
    }

    @GetMapping("/chat/messages/{conversation_id}")
    public List<Message> getAllMessageForConversation(@PathVariable String conversation_id){
        return messageService.getMessagesForConversation(conversation_id);
    }

    @GetMapping("/chat/whoami")
    public ResponseEntity<Map<String, String>> getCurrentUser(Authentication authentication) {
        boolean authenticated = authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal());
        if (!authenticated) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(Map.of("username", authentication.getName()));
    }

}
