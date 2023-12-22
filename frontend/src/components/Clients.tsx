import { UnstyledButton, SimpleGrid, Avatar, Menu } from "@mantine/core";
import { useGame } from "../hooks/useGame";
import { useSocket } from "../hooks/useSocket";
import { IconCrown } from "@tabler/icons-react";
import { IconCheck } from "@tabler/icons-react";

const Clients = () => {
  const { socket } = useSocket();
  const { setRoom, colors, room } = useGame();

  const clients = [...room.clients];

  const index = clients.findIndex(client => client.id === socket?.id);

  clients.unshift(clients.splice(index, 1)[0]);

  const isHost = clients.find(client => client?.id === socket?.id)?.isHost;

  const handleOnPromoteToHostClick = (id: string) => {
    if (!isHost) return;

    socket?.emit("PROMOTE_TO_HOST", id);

    setRoom(curr => {
      const copy = { ...curr };
      const currentHost = copy.clients.find(client => client.id === socket?.id)!;
      const newHost = copy.clients.find(client => client.id === id)!;

      currentHost.isHost = false;
      currentHost.isReady = false;
      newHost.isHost = true;
      newHost.isReady = false;

      return copy;
    });
  };

  const handleOnKickClick = (id: string) => {
    if (!isHost) return;

    socket?.emit("KICK_CLIENT", id);
  };

  return (
    <SimpleGrid cols={{ base: 4, xs: 4, sm: 8, md: 8, lg: 8 }} w={"fit-content"} m="auto">
      {clients.map((client, index) => (
        <div key={client?.id || index} className="client-container">
          <Menu shadow="md" width={150}>
            <Menu.Target>
              <UnstyledButton>
                <Avatar variant={"filled"} size={"3rem"} color={colors[client?.index || 0]}>
                  {client?.name
                    ?.split(" ")
                    .map(part => part[0])
                    .join("")
                    .toUpperCase()}
                </Avatar>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>{client?.name}</Menu.Label>

              {isHost && client?.id !== socket!.id ? (
                <>
                  <Menu.Item onClick={() => handleOnPromoteToHostClick(client?.id)}>Promote to host</Menu.Item>
                  <Menu.Item color="red" onClick={() => handleOnKickClick(client?.id)}>
                    Kick
                  </Menu.Item>
                </>
              ) : null}
            </Menu.Dropdown>
          </Menu>

          {client?.isHost ? (
            <div className="icon-top-center">
              <IconCrown pointerEvents={"none"} size={"1.75rem"} color="gold" stroke={2} />
            </div>
          ) : null}

          {client?.isReady || client?.isAnswerPicked ? (
            <div className="icon-bottom-right">
              <IconCheck pointerEvents={"none"} size={"1.5rem"} color="white" stroke={2} />
            </div>
          ) : null}
        </div>
      ))}

      {[...Array(8 - clients.length).keys()].map((_, i) => (
        <Avatar size={"3rem"} src={null} key={i} />
      ))}
    </SimpleGrid>
  );
};

export default Clients;
