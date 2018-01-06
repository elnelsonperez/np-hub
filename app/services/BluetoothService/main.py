from bluetooth import *
import thread
import json
import sys
import bluetoothctl

class Type:
    RETURN = "RETURN"
    EXCEPTION = "EXCEPTION"
    LOG = "LOG"
    EVENT = "EVENT"

def invoke_parser(argstring):
    args = argstring.split("|")
    return {
        "method": args[0],
        "mac_address": args[1],
        "payload": args[2],
        "corr_id": args[3]
    }

class bluetoothManager:
    connections = {}
    actions = {
        "invoke": invoke_parser
    }
    listenCounter = 0
    bluetoothctl = None
    config = None

    def __init__(self):
        self.bluetoothctl = bluetoothctl.Bluetoothctl()
        self.bluetoothctl.set_default_agent()
        self.turn_on_auto_pair()
        thread.start_new_thread(self.read_input, ())
        self.output(Type.EVENT, "INITIALIZED")
        self.create_server()
        if sys.argv[1]:
            self.config = json.loads(sys.argv[1])

    def turn_on_auto_pair(self):
        self.bluetoothctl.make_discoverable()
        self.bluetoothctl.auto_accept_on = True

    def turn_off_auto_pair(self):
        self.bluetoothctl.auto_accept_on = False

    def read_input (self):
        while True:
            data = raw_input()
            if len(data) == 0: break
            self.parse_input_command(data)

    def parse_input_command(self, command):
        action_and_params = command.split("||")
        action = action_and_params[0]
        params = action_and_params[1]
        if action:
            if action in self.actions:
                if self.actions[action]:
                    # noinspection PyCallingNonCallable
                    args = self.actions[action](params)
                    if action == "invoke":
                        self.invoke (
                            method=args.get('method'),
                            mac_address=args.get('mac_address'),
                            payload=args.get('payload'),
                            corr_id=args.get('corr_id'))
            else:
                self.output(Type.LOG, "UNRECOGNIZED_ACTION")


    def create_server(self):
        self.listenCounter = self.listenCounter + 1
        server_sock = BluetoothSocket(RFCOMM)
        server_sock.bind(("", PORT_ANY))
        server_sock.listen(self.listenCounter)
        port = server_sock.getsockname()[1]
        uuid = "7f3d94e2-7fdf-44c7-813a-131727f5faef"
        advertise_service(server_sock, "NP Server",
                          service_id=uuid,
                          service_classes=[uuid, SERIAL_PORT_CLASS],
                          profiles=[SERIAL_PORT_PROFILE]
                          )
        thread.start_new_thread(self.wait_for_connections, (server_sock,))
        self.output(Type.EVENT, "SERVER_CREATED",  json.dumps({"channel": port}))

    def wait_for_connections (self, server_sock):
        client_sock, client_info = server_sock.accept()
        mac_address = client_info[0]
        # Mac address validation
        if self.config \
            and self.config.get('allowedMacAddreses') \
            and mac_address not in self.config.get('allowedMacAddreses'):
            client_sock.close()
            server_sock.close()
        else:
            self.output(Type.EVENT,"NEW_CONNECTION", json.dumps({"mac_address": mac_address}))
            self.connections[mac_address] = {"client_sock": client_sock, "server_sock": server_sock}
            thread.start_new_thread(self.read_from_client, (mac_address,))
            #always keep a server up for new connections
        self.create_server()

    def write_to_client (self, mac_address, payload):
        client = self.connections.get(mac_address)
        try:
            client = self.connections.get(mac_address)
            client.get("client_sock").send(payload + "\n")
            return True
        except IOError as e:
            client.get("client_sock").close()
            client.get("server_sock").close()
            self.output(Type.EVENT, "DISCONNECTED", json.dumps({"mac_address": mac_address}))

    def output (self, type, name, payload = None):
        output = type+"|"+name
        if payload is not None:
            output = output + "|" + payload
        print(output)
        sys.stdout.flush()

    def invoke (self,  method, mac_address, payload,corr_id = None):
        self.output(Type.RETURN, method, json.dumps({"mac_address": mac_address,
                                                     "corr_id": corr_id,
                                                     "return": getattr(self, method)(mac_address, payload)}))

    def read_from_client (self, mac_address):
        client = self.connections.get(mac_address)
        try:
            while True:
                data = client.get("client_sock").recv(1024)
                if len(data) == 0: break
                self.output(Type.EVENT, "RECEIVED", json.dumps({"mac_address": mac_address, "data": data}))
                self.write_to_client(mac_address, "Mensaje Recibido")
        except IOError as e:
            pass

        client.get("client_sock").close()
        client.get("server_sock").close()
        self.output(Type.EVENT, "DISCONNECTED",json.dumps({"mac_address": mac_address}))

if __name__ == "__main__":

    obj = bluetoothManager()
    while True:
        pass




