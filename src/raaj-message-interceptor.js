/*
 * Copyright (C) 2013 Iorga Group
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see [http://www.gnu.org/licenses/].
 */
(function () {
    'use strict';

    angular.module('raaj-message-interceptor', ['raaj-message-service'])
        .factory('raajMessageInterceptor', function(raajMessageService) {
            return {
                applyFieldMessages: function(response) {
                    var raajFieldMessages = response.data.raajFieldMessages;
                    if (raajFieldMessages) {
                        // there are some field messages to display
                        for (var i = 0 ; i < raajFieldMessages.length ; i++) {
                            var raajFieldMessage = raajFieldMessages[i];
                            var id = raajFieldMessage.id;
                            if (!id) {
                                // the final id has not been sent, let's recompute it
                                id = response.config.raajMessagesIdPrefix;
                                for (var j = 0 ; j < raajFieldMessage.propertyPath.length ; j++) {
                                    if (id) {
                                        id += '-';
                                    }
                                    id += raajFieldMessage.propertyPath[j];
                                }
                            }
                            raajMessageService.displayFieldMessage({
                                message: raajFieldMessage.message,
                                type: raajFieldMessage.type,
                                id: id
                            }, response.config.raajMessagesIdPrefix);
                        }
                    }
                    var raajMessages = response.data.raajMessages;
                    if (raajMessages) {
                        // there are some form messages to display
                        raajMessageService.displayMessages(raajMessages, response.config.raajMessagesIdPrefix);
                    }
                    return raajFieldMessages || raajMessages;
                }
            }
        })
        .factory('raajMessageRequestInterceptor', function($q, raajMessageService, raajMessageInterceptor) {
            return {
                'response': function(response) {
                    raajMessageInterceptor.applyFieldMessages(response);
                    return response;
                },
                'responseError': function(rejection) {
                    if (!raajMessageInterceptor.applyFieldMessages(rejection)) {
                        // no message found in the request, it's a more global problem, let's display it
                        raajMessageService.displayMessage({message: rejection.status+' : '+rejection.data, type: 'error'});
                    }
                    return $q.reject(rejection);
                },
                'request': function(config) {
                    if (config.raajClearFieldMessages) {
                        raajMessageService.clearFieldMessages(config.raajMessagesIdPrefix);
                    }
                    if (config.raajClearAllMessages) {
                        raajMessageService.clearAllMessages(config.raajMessagesIdPrefix);
                    }
                    return config;
                }
            };
        })
        .config(function ($httpProvider) {
            $httpProvider.interceptors.push('raajMessageRequestInterceptor');
        })
    ;
})();
